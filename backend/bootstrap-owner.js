import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { query } from './db.js';

export async function bootstrapOwner() {
  const email = (process.env.ADMIN_EMAILS || '').split(',')[0].trim().toLowerCase();
  if (!email) throw new Error('ADMIN_EMAILS is required for the owner account');
  if ((await query('SELECT id FROM users WHERE email=$1 AND role=$2', [email,'admin'])).rows.length) return;
  const password=process.env.ADMIN_PASSWORD;
  if (!password || password.length<12) throw new Error('Set ADMIN_PASSWORD (12+ characters) in Render before the first deployment');
  const hash=await bcrypt.hash(password,12);
  await query(`INSERT INTO users(id,email,password_hash,role,business_name,contact_name,status,created_at)
    VALUES($1,$2,$3,'admin','RepuGuard','Owner','active',$4)`,[randomUUID(),email,hash,new Date().toISOString()]);
}
