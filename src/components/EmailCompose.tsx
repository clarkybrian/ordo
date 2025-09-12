import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Bot, Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { openaiService } from '../services/openai';
import { gmailService } from '../services/gmail';
import ScopeWarning from './ScopeWarning';
import type { Email } from '../types';

interface EmailComposeProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: Email; // Email auquel on répond (optionnel)
  recipient?: string; // Destinataire pré-défini
}

export default function EmailCompose({ isOpen, onClose, replyTo, recipient }: EmailComposeProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showScopeWarning, setShowScopeWarning] = useState(false);
  const [scopeWarningMessage, setScopeWarningMessage] = useState('');

  // Pré-remplir les champs si c'est une réponse
  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.sender_email);
      setSubject(replyTo.subject?.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`);
      // Message de citation
      const quotedMessage = `


------- Message original -------
De: ${replyTo.sender_name} <${replyTo.sender_email}>
Date: ${new Date(replyTo.received_at).toLocaleString('fr-FR')}
Objet: ${replyTo.subject}

${replyTo.body_text || replyTo.snippet}`;
      setMessage(quotedMessage);
    } else if (recipient) {
      setTo(recipient);
    }
  }, [replyTo, recipient]);

  // Fonction d'analyse IA du message
  const analyzeWithAI = async () => {
    if (!message.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await openaiService.getAdvancedEmailResponse(
        `Analyse ce brouillon d'email et suggère des améliorations pour le rendre plus professionnel, clair et efficace. Voici le message à analyser :

Destinataire: ${to}
Objet: ${subject}
Message: ${message}

Donne-moi une version améliorée avec des explications des changements suggérés.`,
        []
      );
      
      if (response.content) {
        setAiSuggestion(response.content);
        setShowAIAssistant(true);
      }
    } catch (error) {
      console.error('Erreur analyse IA:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fonction d'envoi d'email
  const sendEmail = async () => {
    if (!to || !subject || !message) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setIsSending(true);
    try {
      // 1. Sauvegarder dans la table sent_emails
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data: sentEmail, error: dbError } = await supabase
        .from('sent_emails')
        .insert({
          user_id: user.id,
          to_email: to,
          to_name: to.split('@')[0], // Nom par défaut basé sur l'email
          subject,
          body_text: message,
          reply_to_email_id: replyTo?.id || null,
          original_thread_id: replyTo?.thread_id || null,
          original_message_id: replyTo?.id || null,
          ai_assisted: showAIAssistant,
          ai_improvements: aiSuggestion || null,
          attachments: attachments.map(f => ({ name: f.name, size: f.size, type: f.type })),
          status: 'sent'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Envoyer l'email via Gmail API
      console.log('📧 Envoi de l\'email via Gmail API...');
      
      const gmailResult = await gmailService.sendEmail({
        to: to,
        subject: subject,
        body: message,
        replyTo: replyTo ? {
          messageId: replyTo.gmail_id,
          threadId: replyTo.thread_id || replyTo.gmail_id
        } : undefined
      });

      if (gmailResult.success) {
        // Mettre à jour l'email sauvegardé avec l'ID Gmail
        if (gmailResult.messageId) {
          await supabase
            .from('sent_emails')
            .update({ 
              gmail_message_id: gmailResult.messageId,
              status: 'sent'
            })
            .eq('id', sentEmail.id);
        }
        
        console.log('✅ Email envoyé avec succès via Gmail API');
        alert('Email envoyé avec succès ! 🎉');
      } else {
        // Marquer comme échec dans la base de données
        await supabase
          .from('sent_emails')
          .update({ status: 'failed' })
          .eq('id', sentEmail.id);
          
        throw new Error(gmailResult.error || 'Erreur lors de l\'envoi');
      }

      onClose();
      
      // Reset du formulaire
      setTo('');
      setSubject('');
      setMessage('');
      setAttachments([]);
      setAiSuggestion('');
      setShowAIAssistant(false);

    } catch (error) {
      console.error('Erreur envoi email:', error);
      
      // Vérifier si c'est une erreur de permissions
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      if (errorMessage.includes('PERMISSIONS INSUFFISANTES') || errorMessage.includes('insufficient authentication scopes')) {
        setScopeWarningMessage(errorMessage);
        setShowScopeWarning(true);
      } else {
        alert(`Erreur lors de l'envoi de l'email: ${errorMessage}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Fonction pour ajouter des pièces jointes
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Fonction pour supprimer une pièce jointe
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {replyTo ? 'Répondre à l\'email' : 'Nouvel email'}
                </h2>
                {replyTo && (
                  <p className="text-sm text-gray-600">
                    Réponse à: {replyTo.sender_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeWithAI}
                disabled={isAnalyzing || !message.trim()}
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                <Bot className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyse...' : 'Analyser avec IA'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Formulaire principal */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Destinataire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataire *
                  </label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>

                {/* Sujet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Objet de l'email"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={12}
                    placeholder="Votre message..."
                    required
                  />
                </div>

                {/* Pièces jointes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pièces jointes
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                      <div className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Ajouter des fichiers
                      </div>
                    </label>
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSending}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={sendEmail}
                    disabled={isSending || !to || !subject || !message}
                    className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                  >
                    {isSending ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Panneau Assistant IA */}
            <AnimatePresence>
              {showAIAssistant && (
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className="w-96 border-l border-gray-200 bg-gradient-to-b from-purple-50 to-blue-50 p-6 overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-purple-900 flex items-center">
                      <Bot className="h-5 w-5 mr-2" />
                      Assistant IA
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAIAssistant(false)}
                      className="text-gray-500 hover:text-gray-700 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {aiSuggestion}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMessage(aiSuggestion);
                        setShowAIAssistant(false);
                      }}
                      className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                      disabled={!aiSuggestion}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Utiliser
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={analyzeWithAI}
                      disabled={isAnalyzing}
                      className="flex-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Sparkles className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Refaire
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Alerte de permissions insuffisantes */}
      {showScopeWarning && (
        <ScopeWarning
          message={scopeWarningMessage}
          onClose={() => setShowScopeWarning(false)}
        />
      )}
    </AnimatePresence>
  );
}
