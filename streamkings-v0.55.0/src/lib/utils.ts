export function formatUserRole(role: string): string {
  switch (role) {
    case 'DJ':
      return 'DJ/Streamer';
    case 'TASTEMAKER':
      return 'Tastemaker';
    case 'ARTIST':
      return 'Artist';
    default:
      return role;
  }
} 