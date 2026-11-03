import type { AuthUser } from './user'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: Omit<AuthUser, 'email'> & { email?: string }
}

export interface RefreshedTokens {
  accessToken: string
  refreshToken: string
}

export type OtpPurpose = 'email_verify' | 'password_reset'

export interface MessageResponse {
  message: string
}

export interface RegistrationResponse extends MessageResponse {
  userId: string
}
