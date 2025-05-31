import { Schema, model, Document } from 'mongoose';

export interface User extends Document {
  keycloakId: string; // The 'sub' (subject) from Keycloak token
  firstName: string;
  lastName: string;
  age?: number; // Optional if Keycloak doesn't provide it always
  dateOfBirth?: Date; // Optional
  userName: string;
  email: string;
  // No password field here!
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>({
  keycloakId: {
    type: String,
    required: true,
    unique: true, // Ensure uniqueness for Keycloak ID
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    min: 18,
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function (value: Date) {
        if (!value) return true; // Allow null/undefined if not required
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return value <= eighteenYearsAgo;
      },
      message: 'You must be at least 18 years old.',
    },
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/,
  },
}, {
  timestamps: true,
});

export { userSchema };
export const UserModel = model<User>('User', userSchema); 