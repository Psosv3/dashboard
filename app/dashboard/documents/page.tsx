import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import CodeBlock from '@/components/CodeBlock'

export default async function DocumentationPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Récupérer le profil utilisateur et l'entreprise
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      companies (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const companyId = profile.companies?.id
  const scriptCode = `<script src="https://chatbot.onexus.tech/api/widget-script?company_id=${companyId}"></script>`
  
  // Récupérer la vraie URL webhook de l'intégration Facebook
  const { data: integration } = await supabase
    .from('company_integrations')
    .select('webhook_url')
    .eq('company_id', companyId)
    .eq('integration_type', 'facebook')
    .eq('is_active', true)
    .single()
  
  const webhookUrl = integration?.webhook_url || `https://chatbot.onexus.tech/api/messenger/webhook?verify_token=VotreVerifyToken&app_secret=VotreAppToken&page_token=VotrePageToken`

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Documentation d'intégration
          </h1>
          <p className="text-gray-600 mt-2">
            Apprenez comment intégrer votre chatbot personnalisé sur votre site web
          </p>
        </div>

        {/* Section principale */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Comment implémenter le chatbot sur votre site
          </h2>

          <div className="space-y-6">
            {/* Étape 1 */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 1 : Copiez le code d'intégration
              </h3>
              <p className="text-gray-600 mb-4">
                Copiez le code suivant et collez-le dans votre site web, de préférence juste avant la balise <code className="bg-gray-100 px-2 py-1 rounded">&lt;/body&gt;</code> :
              </p>
              
              <CodeBlock code={scriptCode} />
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Note :</strong> Ce code est unique à votre entreprise ({profile.companies?.name}). 
                  L'ID de votre entreprise est : <code className="bg-blue-100 px-2 py-1 rounded">{companyId}</code>
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 2 : Vérifiez l'installation
              </h3>
              <p className="text-gray-600 mb-4">
                Une fois le code ajouté à votre site :
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Le chatbot apparaîtra automatiquement en bas à droite de votre page</li>
                <li>Vos visiteurs pourront poser des questions sur vos documents</li>
                <li>Le chatbot utilisera uniquement les documents que vous avez uploadés dans votre dashboard</li>
              </ul>
            </div>

            {/* Étape 3 */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 3 : Personnalisation (en cours de développement)
              </h3>
              <p className="text-gray-600 mb-4">
                Vous pouvez personnaliser l'apparence du chatbot en ajoutant des attributs :
              </p>
              
              <div className="mb-4">
                <CodeBlock code={`<script 
  src="https://chatbot.onexus.tech/${companyId}"
  data-theme="light"
  data-position="bottom-right"
  data-primary-color="#3B82F6"
></script>`} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Options disponibles :</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><code>data-theme</code> : "light" ou "dark"</li>
                    <li><code>data-position</code> : "bottom-right", "bottom-left"</li>
                    <li><code>data-primary-color</code> : couleur hexadécimale</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Valeurs par défaut :</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Thème : light</li>
                    <li>Position : bottom-right</li>
                    <li>Couleur : #3B82F6</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section conseils */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            💡 Conseils pour une meilleure intégration
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Préparation des documents</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Uploadez des documents pertinents et à jour</li>
                <li>• Utilisez des titres clairs dans vos documents</li>
                <li>• Organisez vos informations de manière logique</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Le script se charge de manière asynchrone</li>
                <li>• Aucun impact sur la vitesse de votre site</li>
                <li>• Fonctionne sur tous les navigateurs modernes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section intégration Facebook Messenger */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Intégration Facebook Messenger
              </h2>
              <p className="text-gray-600">
                Connectez votre chatbot à Facebook Messenger pour répondre automatiquement aux messages
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5C3.312 16.333 4.27 18 5.81 18z" />
              </svg>
              <p className="text-amber-800 text-sm font-medium">
                Prérequis : Vous devez avoir une page Facebook professionnelle pour continuer
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Étape 1 : Accéder à Facebook Developers */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 1 : Créer une application Facebook
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Rendez-vous sur <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">developers.facebook.com</a> et connectez-vous avec votre compte Facebook.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Actions à effectuer :</h4>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Cliquez sur <strong>"Mes applications"</strong> en haut à droite</li>
                    <li>Cliquez sur <strong>"Créer une application"</strong></li>
                    <li>Sélectionnez <strong>"Consommateur"</strong> comme type d'application</li>
                    <li>Donnez un nom à votre application (ex: "Chatbot MonEntreprise")</li>
                    <li>Renseignez votre email de contact</li>
                    <li>Cliquez sur <strong>"Créer l'ID d'application"</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Étape 2 : Configurer Messenger */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 2 : Ajouter Messenger à votre application
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Dans le tableau de bord de votre application :
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Actions à effectuer :</h4>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Dans la section <strong>"Ajouter des produits"</strong>, trouvez <strong>"Messenger"</strong></li>
                    <li>Cliquez sur <strong>"Configurer"</strong> à côté de Messenger</li>
                    <li>Dans la page Messenger, descendez jusqu'à <strong>"Jeton d'accès"</strong></li>
                    <li>Cliquez sur <strong>"Ajouter ou supprimer des pages"</strong></li>
                    <li>Sélectionnez votre page Facebook et accordez les permissions</li>
                    <li>Un <strong>jeton d'accès à la page</strong> sera généré - <span className="text-red-600 font-semibold">copiez-le précieusement !</span></li>
                  </ol>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    <strong>Important :</strong> Ce jeton d'accès à la page sera votre <strong>"Page Token"</strong> - gardez-le en sécurité, vous en aurez besoin plus tard !
                  </p>
                </div>
              </div>
            </div>

            {/* Étape 3 : Récupérer l'App Token */}
            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 3 : Récupérer l'App Token
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  L'App Token est le secret de votre application :
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Actions à effectuer :</h4>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Dans le menu de gauche, cliquez sur <strong>"Paramètres" → "De base"</strong></li>
                    <li>Trouvez la section <strong>"Clé secrète de l'application"</strong></li>
                    <li>Cliquez sur <strong>"Afficher"</strong> et entrez votre mot de passe Facebook</li>
                    <li><span className="text-red-600 font-semibold">Copiez cette clé secrète - c'est votre "App Token" !</span></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Étape 4 : Configurer dans notre dashboard */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 4 : Configurer l'intégration dans votre dashboard
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Maintenant, retournez sur votre dashboard (page Entreprise) :
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Actions à effectuer :</h4>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Allez dans la section <strong>"Intégrations Facebook"</strong></li>
                    <li>Cliquez sur <strong>"Ajouter une intégration"</strong></li>
                    <li>Remplissez les champs :
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><strong>Type :</strong> Facebook</li>
                        <li><strong>App Token :</strong> La clé secrète récupérée à l'étape 3</li>
                        <li><strong>Page Token :</strong> Le jeton d'accès à la page de l'étape 2</li>
                        <li><strong>Verify Token :</strong> Inventez un mot de passe sécurisé (ex: "MonChatbot2024!")</li>
                      </ul>
                    </li>
                    <li>Une <strong>URL Webhook</strong> sera automatiquement générée</li>
                    <li><span className="text-red-600 font-semibold">Copiez cette URL Webhook !</span></li>
                  </ol>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {integration?.webhook_url ? "📋 Votre URL Webhook :" : "📋 Exemple d'URL Webhook :"}
                  </h4>
                  <CodeBlock code={webhookUrl} />
                  {integration?.webhook_url ? (
                    <p className="text-xs text-green-600 mt-2">
                      ✅ Cette URL est générée depuis votre intégration Facebook configurée. Copiez-la pour Facebook Developers.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Configurez d'abord votre intégration Facebook dans la page Entreprise pour voir votre vraie URL webhook.
                    </p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <ol className="list-decimal list-inside text-gray-600 space-y-2" start={6}>
                    <li>Cliquez sur <strong>"Ajouter"</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Étape 5 : Configurer le Webhook dans Facebook */}
            <div className="border-l-4 border-red-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 5 : Configurer le Webhook dans Facebook
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Retournez sur Facebook Developers pour configurer le webhook :
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Actions à effectuer :</h4>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Dans votre application Facebook, allez dans <strong>"Messenger" → "Paramètres"</strong></li>
                    <li>Trouvez la section <strong>"Webhooks"</strong></li>
                    <li>Cliquez sur <strong>"Ajouter une URL de rappel"</strong></li>
                    <li>Remplissez :
                      <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                        <li><strong>URL de rappel :</strong> L'URL Webhook copiée depuis votre dashboard</li>
                        <li><strong>Jeton de vérification :</strong> Le Verify Token que vous avez inventé à l'étape 4</li>
                      </ul>
                    </li>
                    <li>Cliquez sur <strong>"Vérifier et enregistrer"</strong></li>
                    <li>Si tout est correct, vous verrez une coche verte ✅</li>
                    <li>Cliquez sur <strong>"Ajouter des abonnements"</strong></li>
                    <li>Sélectionnez votre page Facebook</li>
                    <li>Cochez <strong>"messages"</strong> et <strong>"messaging_postbacks"</strong></li>
                    <li>Cliquez sur <strong>"S'abonner"</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Étape 6 : Test */}
            <div className="border-l-4 border-teal-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Étape 6 : Testez votre intégration
              </h3>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Vérifiez que tout fonctionne correctement :
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Actions à effectuer :</h4>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Allez sur votre page Facebook</li>
                    <li>Envoyez un message privé à votre page</li>
                    <li>Votre chatbot devrait répondre automatiquement ! 🎉</li>
                  </ol>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    <strong>Félicitations !</strong> Si votre chatbot répond, l'intégration est réussie. Vos clients peuvent maintenant poser des questions via Facebook Messenger et recevoir des réponses basées sur vos documents uploadés.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section dépannage */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🔧 Dépannage - Problèmes fréquents
            </h3>
            <div className="space-y-4">
              <div className="border-b border-yellow-200 pb-3">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Le webhook ne se vérifie pas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vérifiez que le Verify Token est exactement le même dans Facebook et votre dashboard</li>
                  <li>• Assurez-vous que l'URL Webhook est correctement copiée (sans espaces)</li>
                  <li>• Attendez quelques minutes et réessayez</li>
                </ul>
              </div>
              <div className="border-b border-yellow-200 pb-3">
                <h4 className="font-semibold text-gray-900 mb-2">❌ Le chatbot ne répond pas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vérifiez que l'intégration est marquée comme "Active" dans votre dashboard</li>
                  <li>• Assurez-vous d'avoir uploadé des documents dans votre chatbot</li>
                  <li>• Vérifiez que les tokens sont corrects et non expirés</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">❌ Erreur d'autorisation</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vérifiez que votre page Facebook est bien connectée à l'application</li>
                  <li>• Assurez-vous d'être administrateur de la page Facebook</li>
                  <li>• Régénérez le Page Token si nécessaire</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section support */}
        {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🆘 Besoin d'aide ?
          </h3>
          <p className="text-gray-600 mb-4">
            Si vous rencontrez des difficultés lors de l'intégration, voici quelques ressources :
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Documentation</h4>
              <p className="text-sm text-gray-600">
                Consultez notre guide complet d'intégration
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Support technique</h4>
              <p className="text-sm text-gray-600">
                Contactez notre équipe pour une assistance personnalisée
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Communauté</h4>
              <p className="text-sm text-gray-600">
                Rejoignez notre communauté d'utilisateurs
              </p>
            </div>
          </div>
        </div> */}

        
      </div>
    </DashboardLayout>
  )
}
