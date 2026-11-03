export type UserRole = 'dean' | 'technician' | 'teacher' | 'super_admin'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  schoolId: string | null
}
