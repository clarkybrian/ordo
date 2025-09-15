import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-white/80">
            Dernière mise à jour : 15 septembre 2025
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-white"
        >
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="mb-4">
                Ordo ("nous", "notre", "nos") s'engage à protéger votre vie privée et vos données personnelles. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et 
                protégeons vos informations lorsque vous utilisez notre application de classification automatique d'emails.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Données collectées</h2>
              <h3 className="text-xl font-medium mb-3">2.1 Données personnelles</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Nom et adresse email (via Google OAuth)</li>
                <li>Photo de profil (si disponible via Google)</li>
                <li>Préférences de l'application</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-3">2.2 Données d'emails</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Métadonnées des emails (expéditeur, destinataire, sujet, date)</li>
                <li>Contenu des emails pour la classification IA</li>
                <li>Pièces jointes (métadonnées uniquement)</li>
                <li>Catégories personnalisées créées par l'utilisateur</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.3 Données techniques</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Informations sur l'appareil et le navigateur</li>
                <li>Adresse IP et géolocalisation approximative</li>
                <li>Logs d'utilisation et données analytiques</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Utilisation des données</h2>
              <p className="mb-4">Nous utilisons vos données pour :</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Fournir et améliorer nos services de classification d'emails</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Entraîner et améliorer notre IA de classification</li>
                <li>Assurer la sécurité et prévenir les abus</li>
                <li>Vous contacter concernant votre compte ou nos services</li>
                <li>Analyser l'utilisation pour améliorer l'application</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Partage des données</h2>
              <p className="mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données uniquement dans les cas suivants :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Avec votre consentement explicite</li>
                <li>Avec nos prestataires de services (Supabase, OpenAI) sous contrat de confidentialité</li>
                <li>Pour répondre à des obligations légales</li>
                <li>Pour protéger nos droits, votre sécurité ou celle d'autrui</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Sécurité des données</h2>
              <p className="mb-4">Nous mettons en place des mesures de sécurité robustes :</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Chiffrement en transit (HTTPS/TLS) et au repos</li>
                <li>Authentification OAuth sécurisée avec Google</li>
                <li>Accès restreint aux données par principe de moindre privilège</li>
                <li>Audits de sécurité réguliers</li>
                <li>Surveillance continue des menaces</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Conservation des données</h2>
              <p className="mb-4">
                Nous conservons vos données aussi longtemps que nécessaire pour fournir nos services :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Données de compte : jusqu'à suppression du compte</li>
                <li>Emails et classifications : jusqu'à 7 ans après suppression du compte</li>
                <li>Logs techniques : maximum 2 ans</li>
                <li>Données analytiques anonymisées : sans limite de temps</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Vos droits (RGPD)</h2>
              <p className="mb-4">Conformément au RGPD, vous avez le droit de :</p>
              <ul className="list-disc ml-6 mb-4">
                <li><strong>Accès :</strong> Obtenir une copie de vos données personnelles</li>
                <li><strong>Rectification :</strong> Corriger les données inexactes</li>
                <li><strong>Suppression :</strong> Demander l'effacement de vos données</li>
                <li><strong>Portabilité :</strong> Exporter vos données dans un format standard</li>
                <li><strong>Opposition :</strong> Vous opposer au traitement de vos données</li>
                <li><strong>Limitation :</strong> Demander la limitation du traitement</li>
              </ul>
              <p className="mb-4">
                Pour exercer ces droits, contactez-nous à : <strong>privacy@ordo-app.com</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Cookies et technologies similaires</h2>
              <p className="mb-4">
                Nous utilisons des cookies et technologies similaires pour :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Maintenir votre session de connexion</li>
                <li>Sauvegarder vos préférences</li>
                <li>Améliorer les performances de l'application</li>
                <li>Analyser l'utilisation (analytics)</li>
              </ul>
              <p className="mb-4">
                Vous pouvez contrôler les cookies via les paramètres de votre navigateur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Transferts internationaux</h2>
              <p className="mb-4">
                Vos données peuvent être traitées dans des pays en dehors de l'UE, notamment :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>États-Unis (Supabase, OpenAI) - Décision d'adéquation ou clauses contractuelles types</li>
                <li>Toujours avec des garanties appropriées selon le RGPD</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Mineurs</h2>
              <p className="mb-4">
                Notre service n'est pas destiné aux mineurs de moins de 16 ans. Nous ne collectons 
                pas sciemment de données personnelles d'enfants de moins de 16 ans.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Modifications</h2>
              <p className="mb-4">
                Nous nous réservons le droit de modifier cette politique. Les modifications importantes 
                vous seront notifiées par email au moins 30 jours avant leur entrée en vigueur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
              <p className="mb-4">
                Pour toute question concernant cette politique de confidentialité :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Email : <strong>privacy@ordo-app.com</strong></li>
                <li>Adresse : Ordo, 123 Avenue de l'Innovation, 75001 Paris, France</li>
                <li>DPO : <strong>dpo@ordo-app.com</strong></li>
              </ul>
              <p>
                Vous pouvez également contacter l'autorité de contrôle compétente (CNIL en France).
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}