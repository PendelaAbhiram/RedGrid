import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { askDrClara, SafeDonorContext, ChatHistoryItem } from '../services/geminiService';
import { prisma } from '../prisma';

const router = Router();

// In-memory sliding window rate limiter: 15 requests per minute per user
interface RateLimitRecord {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId) || { timestamps: [] };

  // Filter out timestamps older than the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.timestamps.push(now);
  rateLimitMap.set(userId, record);
  return true;
}

// Clean up stale rate limiter entries every 5 minutes to prevent memory leak
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [userId, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(userId);
    }
  }
}, 5 * 60 * 1000);
cleanupInterval.unref();

const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message cannot exceed 500 characters'),
  history: z
    .array(
      z.object({
        sender: z.enum(['user', 'bot']),
        text: z.string().max(1000),
      })
    )
    .max(10, 'History cannot exceed 10 messages')
    .optional(),
});

/**
 * POST /api/assistant/chat
 * Secure AI interaction endpoint for Dr. Clara Transfusion Assistant.
 * Requires active JWT authentication.
 */
router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    // 1. Rate limiting check (15 req/min per user)
    if (!checkRateLimit(user.id)) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Dr. Clara allows up to 15 questions per minute.',
      });
      return;
    }

    // 2. Request payload validation
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues.map((issue) => issue.message);
      res.status(400).json({
        error: 'Bad Request',
        details: errorMessages,
      });
      return;
    }

    const { message, history } = parseResult.data;

    // 3. Extract safe, privacy-compliant user context (no sensitive credentials/GPS)
    const safeContext: SafeDonorContext = {
      firstName: user.name ? user.name.split(' ')[0] : undefined,
      role: user.role,
      bloodGroup: user.donorProfile?.bloodGroup || undefined,
      isAvailableToDonate: user.donorProfile?.isAvailableToDonate,
      totalDonations: user.donorProfile?.totalDonations,
    };

    // Calculate days since last donation if user has donor records
    if (user.donorProfile?.lastDonationDate) {
      const msDiff = Date.now() - new Date(user.donorProfile.lastDonationDate).getTime();
      safeContext.daysSinceLastDonation = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
    } else {
      // Check donation record count as fallback
      try {
        const donationCount = await prisma.donationRecord.count({
          where: { donorUserId: user.id },
        });
        if (donationCount > 0 && !safeContext.totalDonations) {
          safeContext.totalDonations = donationCount;
        }
      } catch {
        // Non-fatal fallback
      }
    }

    // 4. Query Dr. Clara Gemini Service
    const assistantResult = await askDrClara(message, history as ChatHistoryItem[], safeContext);

    res.status(200).json(assistantResult);
  } catch (error: any) {
    console.error('Error handling assistant chat endpoint:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Dr. Clara is temporarily unavailable. Please try again shortly.',
    });
  }
});

export default router;
