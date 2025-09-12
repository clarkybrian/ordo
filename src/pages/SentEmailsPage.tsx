import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Reply, Calendar, User, Mail } from 'lucide-react';

interface SentEmail {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_text: string;
  sent_at: string;
  status: 'sent' | 'draft' | 'failed';
  ai_assisted: boolean;
  reply_to_email_id: string | null;
  original_thread_id: string | null;
}

export default function SentEmailsPage() {
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

  useEffect(() => {
    loadSentEmails();
  }, []);

  const loadSentEmails = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sent_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des emails envoyés:', error);
        return;
      }

      setSentEmails(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Envoyé';
      case 'failed': return 'Échec';
      case 'draft': return 'Brouillon';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des emails envoyés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📤 Emails Envoyés
          </h1>
          <p className="text-gray-600">
            Consultez l'historique de vos emails envoyés depuis Ordo
          </p>
        </div>

        {sentEmails.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun email envoyé
            </h3>
            <p className="text-gray-500 mb-6">
              Vous n'avez pas encore envoyé d'email depuis Ordo.
            </p>
          </div>
        ) : (
          <div className={`grid ${selectedEmail ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
            {/* Liste des emails envoyés */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {sentEmails.length} email{sentEmails.length > 1 ? 's' : ''} envoyé{sentEmails.length > 1 ? 's' : ''}
                  </h2>
                  <button
                    onClick={loadSentEmails}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Actualiser
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {sentEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.to_name || email.to_email}
                          </p>
                          {email.ai_assisted && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              🤖 IA
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                          {email.subject || '(Sans objet)'}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {email.body_text.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="text-xs text-gray-500">
                          {formatDate(email.sent_at)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(email.status)}`}>
                          {getStatusText(email.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Détail de l'email sélectionné */}
            {selectedEmail && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Détail de l'email
                    </h2>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">À :</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedEmail.to_name ? `${selectedEmail.to_name} <${selectedEmail.to_email}>` : selectedEmail.to_email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Objet :</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedEmail.subject || '(Sans objet)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Envoyé le :</span>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedEmail.sent_at).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {selectedEmail.reply_to_email_id && (
                      <div className="flex items-center gap-2">
                        <Reply className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">En réponse à un email</span>
                      </div>
                    )}

                    {selectedEmail.ai_assisted && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        🤖 Assisté par l'IA
                      </div>
                    )}

                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedEmail.status)}`}>
                      {getStatusText(selectedEmail.status)}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Message :</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {selectedEmail.body_text}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
