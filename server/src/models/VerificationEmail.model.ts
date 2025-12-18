import { Schema, model } from 'mongoose';

const verificationEmailSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    type: { type: String, enum: ['verification', 'password_reset'], required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 * 24 }
});

// Compound unique index: allows one token of each type per user
verificationEmailSchema.index({ userId: 1, type: 1 }, { unique: true });

export const VerificationEmailModel = model('VerificationEmail', verificationEmailSchema);