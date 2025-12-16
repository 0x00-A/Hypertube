import { Schema, model } from 'mongoose';

const verificationEmailSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 * 24 } // Token expires in 24 hours
});

export const VerificationEmailModel = model('VerificationEmail', verificationEmailSchema);