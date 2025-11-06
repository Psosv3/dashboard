'use client';

import { useState, useEffect } from 'react';
import ColorPicker from '@/components/ColorPicker';

interface Settings {
  background_color: string;
  general_manual_response: boolean;
  extra_prompt: string;
  company: {
    id: string;
    name: string;
    chatbot_signature?: string;
  };
}

interface SettingsFormProps {
  companyName: string;
}

export default function SettingsForm({ companyName }: SettingsFormProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#4F46E5');
  const [chatbotSignature, setChatbotSignature] = useState('');
  const [generalManualResponse, setGeneralManualResponse] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des paramètres');
      }

      const data = await response.json();
      setSettings(data);
      setBackgroundColor(data.background_color || '#4F46E5');
      setChatbotSignature(data.company?.chatbot_signature || '');
      setGeneralManualResponse(data.general_manual_response || false);
      setExtraPrompt(data.extra_prompt || '');
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Impossible de charger les paramètres' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          background_color: backgroundColor,
          chatbot_signature: chatbotSignature,
          general_manual_response: generalManualResponse,
          extra_prompt: extraPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès !' });
      
      // Recharger les paramètres pour s'assurer que tout est à jour
      setTimeout(() => {
        fetchSettings();
      }, 1000);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des paramètres' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setBackgroundColor(settings.background_color);
      setChatbotSignature(settings.company?.chatbot_signature || '');
      setGeneralManualResponse(settings.general_manual_response || false);
      setExtraPrompt(settings.extra_prompt || '');
      setMessage(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600">
          Configurez l'apparence et les paramètres de votre chatbot
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center">
            {message.type === 'success' ? (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Informations de l'entreprise
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Nom de l'entreprise
            </label>
            <p className="mt-1 text-lg text-gray-900">
              {companyName || 'Non défini'}
            </p>
          </div>
          <div>
            <label htmlFor="chatbot_signature" className="block text-sm font-medium text-gray-700">
              Signature du chatbot
            </label>
            <p className="mt-1 text-xs text-gray-500 mb-2">
              Ce texte s'affichera sous chaque réponse du chatbot (ex: "Ouvert 24h/24, 7j/7")
            </p>
            <input
              type="text"
              id="chatbot_signature"
              value={chatbotSignature}
              onChange={(e) => setChatbotSignature(e.target.value)}
              placeholder="Ouvert 24h/24, 7j/7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-400">
              {chatbotSignature.length}/100 caractères
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Comportement du chatbot
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <label htmlFor="general_manual_response" className="block text-sm font-medium text-gray-700">
                Mode de réponse automatique de l'IA
              </label>
              <p className="mt-1 text-sm text-gray-500">
                {generalManualResponse 
                  ? "Les réponses automatiques de l'IA sont désactivées. Le chatbot ne répondra pas automatiquement aux messages." 
                  : "Les réponses automatiques de l'IA sont activées. Le chatbot répondra automatiquement aux messages."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGeneralManualResponse(!generalManualResponse)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                generalManualResponse ? 'bg-gray-400' : 'bg-indigo-600'
              }`}
              role="switch"
              aria-checked={!generalManualResponse}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  generalManualResponse ? 'translate-x-0' : 'translate-x-5'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label htmlFor="extra_prompt" className="block text-sm font-medium text-gray-700">
              Instructions supplémentaires pour l'IA
            </label>
            <p className="mt-1 text-xs text-gray-500 mb-2">
              Ajoutez des instructions personnalisées pour guider le comportement de l'IA (ex: "Réponds toujours de manière formelle" ou "Utilise un ton amical")
            </p>
            <textarea
              id="extra_prompt"
              value={extraPrompt}
              onChange={(e) => setExtraPrompt(e.target.value)}
              placeholder="Ex: Réponds toujours de manière professionnelle et courtoise..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-400">
              {extraPrompt.length}/1000 caractères
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Apparence du chatbot
        </h2>
        
        <ColorPicker
          value={backgroundColor}
          onChange={setBackgroundColor}
          label="Couleur principale du chatbot"
        />

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || (backgroundColor === settings?.background_color && chatbotSignature === (settings?.company?.chatbot_signature || '') && generalManualResponse === (settings?.general_manual_response || false) && extraPrompt === (settings?.extra_prompt || ''))}
          >
            Réinitialiser
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || (backgroundColor === settings?.background_color && chatbotSignature === (settings?.company?.chatbot_signature || '') && generalManualResponse === (settings?.general_manual_response || false) && extraPrompt === (settings?.extra_prompt || ''))}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900">Information</h3>
            <p className="mt-1 text-sm text-blue-800">
              La couleur sélectionnée sera appliquée au chatbot public visible par vos clients.
              Les changements seront effectifs immédiatement après la sauvegarde.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

