-- Fonction pour nettoyer automatiquement les anciens messages du chatbot
-- Supprime les messages plus anciens que 1 heure

CREATE OR REPLACE FUNCTION public.cleanup_old_chatbot_messages()
RETURNS void AS $$
BEGIN
  -- Supprimer les messages plus anciens que 1 heure
  DELETE FROM public.chatbot_messages 
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  -- Log du nettoyage (optionnel)
  INSERT INTO public.chatbot_sessions (user_id, title, created_at)
  SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid as user_id,
    'Cleanup: ' || ROW_COUNT || ' messages supprimés' as title,
    NOW() as created_at
  WHERE ROW_COUNT > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer aussi les sessions orphelines (sans messages)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_chatbot_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.chatbot_sessions 
  WHERE id NOT IN (
    SELECT DISTINCT session_id 
    FROM public.chatbot_messages
  ) AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction principale de nettoyage (combine les deux)
CREATE OR REPLACE FUNCTION public.cleanup_chatbot_data()
RETURNS void AS $$
BEGIN
  PERFORM public.cleanup_old_chatbot_messages();
  PERFORM public.cleanup_orphaned_chatbot_sessions();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une politique pour permettre l'exécution de la fonction de nettoyage
GRANT EXECUTE ON FUNCTION public.cleanup_chatbot_data() TO anon, authenticated;
