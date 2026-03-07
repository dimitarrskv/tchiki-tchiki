import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://127.0.0.1:5173',
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
};
