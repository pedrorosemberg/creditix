-- Suporte ao provedor de IA "local" (modelo pequeno embutido no próprio
-- servidor, via @huggingface/transformers), além de ollama/gemini.
alter type public.provedor_ia add value 'local';
