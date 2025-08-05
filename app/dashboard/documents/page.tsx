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
  const scriptCode = `<script src="https://chatbot.onexus.tech/${companyId}"></script>`

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
            🤖 Comment implémenter le chatbot sur votre site
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
                Étape 3 : Personnalisation (optionnel)
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

        {/* Section support */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
        </div>
      </div>
    </DashboardLayout>
  )
}
