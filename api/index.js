import express from 'express';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json({ limit: '5mb' }));

const required = ['student_name', 'admission_number', 'class_division', 'roll_number', 'date_of_birth', 'blood_group', 'address', 'parent_name', 'phone_number', 'emergency_contact'];
const db = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase environment variables are not configured.');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
};
const clean = body => Object.fromEntries(Object.entries(body).filter(([key]) => [...required, 'transport_details', 'photo_url'].includes(key)));
const validate = body => required.filter(key => !String(body[key] || '').trim());
const token = () => crypto.randomBytes(24).toString('base64url');
const publicStudent = row => ({ ...row, edit_token: undefined });

async function savePhoto(client, photoData, admission) {
  if (!photoData) return null;
  const matched = photoData.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!matched) throw new Error('Please upload a PNG, JPG, or WEBP photo.');
  const extension = matched[1] === 'image/png' ? 'png' : matched[1] === 'image/webp' ? 'webp' : 'jpg';
  const path = `${admission.replace(/[^a-z0-9_-]/gi, '_')}/${Date.now()}.${extension}`;
  const bytes = Buffer.from(matched[2], 'base64');
  if (bytes.length > 3_500_000) throw new Error('Photo is too large. Please choose a smaller image.');
  const { error } = await client.storage.from('student-photos').upload(path, bytes, { contentType: matched[1], upsert: false });
  if (error) throw error;
  const { data } = client.storage.from('student-photos').getPublicUrl(path);
  return data.publicUrl;
}

app.post('/api/students', async (req, res) => {
  try {
    const missing = validate(req.body); if (missing.length) return res.status(400).json({ error: `Please complete: ${missing.join(', ')}` });
    const client = db(); const student = clean(req.body); const editToken = token();
    if (req.body.photo_data) student.photo_url = await savePhoto(client, req.body.photo_data, student.admission_number);
    const { data, error } = await client.from('students').insert({ ...student, edit_token: editToken, status: 'pending' }).select().single();
    if (error) throw error;
    res.status(201).json({ student: publicStudent(data), edit_token: editToken });
  } catch (error) { res.status(500).json({ error: error.message || 'Unable to save the student record.' }); }
});

app.get('/api/students/:editToken', async (req, res) => {
  try {
    const { data, error } = await db().from('students').select('*').eq('edit_token', req.params.editToken).single();
    if (error || !data) return res.status(404).json({ error: 'This edit link is invalid or has expired.' });
    res.json({ student: publicStudent(data) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/students/:editToken', async (req, res) => {
  try {
    const missing = validate(req.body); if (missing.length) return res.status(400).json({ error: `Please complete: ${missing.join(', ')}` });
    const client = db(); const { data: current, error: lookupError } = await client.from('students').select('*').eq('edit_token', req.params.editToken).single();
    if (lookupError || !current) return res.status(404).json({ error: 'This edit link is invalid or has expired.' });
    if (current.status === 'approved') return res.status(403).json({ error: 'This card is approved and locked. Please contact the school office.' });
    const student = clean(req.body);
    if (req.body.photo_data) student.photo_url = await savePhoto(client, req.body.photo_data, student.admission_number);
    const { data, error } = await client.from('students').update({ ...student, status: 'pending' }).eq('id', current.id).select().single();
    if (error) throw error;
    res.json({ student: publicStudent(data) });
  } catch (error) { res.status(500).json({ error: error.message || 'Unable to update the record.' }); }
});

app.get('/api/admin/students', async (req, res) => {
  if (!process.env.ADMIN_ACCESS_KEY || req.get('x-admin-key') !== process.env.ADMIN_ACCESS_KEY) return res.status(401).json({ error: 'Staff access required.' });
  try {
    const query = String(req.query.q || '').trim();
    let request = db().from('students').select('*').order('created_at', { ascending: false }).limit(100);
    if (query) request = request.or(`student_name.ilike.%${query}%,admission_number.ilike.%${query}%,phone_number.ilike.%${query}%`);
    const { data, error } = await request; if (error) throw error;
    res.json({ students: data.map(publicStudent) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default app;
