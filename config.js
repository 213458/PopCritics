// Configuração do Supabase
const SUPABASE_URL = 'https://yzljxycprnjgcuswcvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bGp4eWNjcHJuamdjdXN3Y3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2Njk1MjIsImV4cCI6MjA5MTI0NTUyMn0.4m9mi52_1CKhooXv3wM5upm1BP-ryDDmapYOqpNWaVQ';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);