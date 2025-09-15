import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function TermsOfServicePage() {
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
            Conditions Générales d'Utilisation
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
              <h2 className="text-2xl font-semibold mb-4">1. Acceptation des conditions</h2>
              <p className="mb-4">
                En accédant et en utilisant Ordo ("le Service"), vous acceptez d'être lié par les présentes 
                Conditions Générales d'Utilisation ("CGU"). Si vous n'acceptez pas ces conditions, 
                veuillez ne pas utiliser notre service.
              </p>
              <p className="mb-4">
                Ces CGU constituent un contrat légalement contraignant entre vous et Ordo SAS 
                ("Ordo", "nous", "notre", "nos").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description du service</h2>
              <p className="mb-4">
                Ordo est une application web progressive (PWA) qui offre :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Classification automatique des emails par intelligence artificielle</li>
                <li>Gestion et organisation de votre messagerie Gmail</li>
                <li>Création de catégories personnalisées</li>
                <li>Analyse et statistiques de votre utilisation email</li>
                <li>Assistant conversationnel pour la gestion des emails</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Éligibilité et compte utilisateur</h2>
              <h3 className="text-xl font-medium mb-3">3.1 Âge minimum</h3>
              <p className="mb-4">
                Vous devez avoir au moins 16 ans pour utiliser ce service. Les utilisateurs de moins de 18 ans 
                doivent avoir l'autorisation de leurs parents ou tuteurs légaux.
              </p>
              
              <h3 className="text-xl font-medium mb-3">3.2 Compte utilisateur</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Vous êtes responsable de maintenir la sécurité de votre compte</li>
                <li>Une seule personne par compte (pas de comptes partagés)</li>
                <li>Vous devez fournir des informations exactes et à jour</li>
                <li>Vous nous notifierez immédiatement de toute utilisation non autorisée</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Utilisation acceptable</h2>
              <h3 className="text-xl font-medium mb-3">4.1 Utilisation autorisée</h3>
              <p className="mb-4">
                Vous pouvez utiliser Ordo pour organiser et gérer votre messagerie personnelle ou professionnelle.
              </p>
              
              <h3 className="text-xl font-medium mb-3">4.2 Utilisation interdite</h3>
              <p className="mb-4">Vous vous engagez à ne pas :</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Utiliser le service à des fins illégales ou non autorisées</li>
                <li>Violer les lois locales, nationales ou internationales</li>
                <li>Transmettre des virus, malwares ou autres codes malveillants</li>
                <li>Tenter d'accéder à des systèmes sans autorisation</li>
                <li>Interférer avec le fonctionnement du service</li>
                <li>Utiliser le service pour harceler, menacer ou nuire à autrui</li>
                <li>Créer de faux comptes ou usurper l'identité d'autrui</li>
                <li>Vendre, louer ou transférer votre accès au service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Abonnements et paiements</h2>
              <h3 className="text-xl font-medium mb-3">5.1 Plans d'abonnement</h3>
              <p className="mb-4">Ordo propose plusieurs formules :</p>
              <ul className="list-disc ml-6 mb-4">
                <li><strong>Gratuit :</strong> Fonctionnalités de base limitées</li>
                <li><strong>Pro :</strong> Fonctionnalités avancées avec abonnement mensuel</li>
                <li><strong>Premium :</strong> Accès complet avec support prioritaire</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-3">5.2 Facturation</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Les abonnements sont facturés à l'avance</li>
                <li>Le renouvellement est automatique sauf résiliation</li>
                <li>Les prix sont susceptibles de changer avec un préavis de 30 jours</li>
                <li>Aucun remboursement pour les périodes partiellement utilisées</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Propriété intellectuelle</h2>
              <p className="mb-4">
                Ordo et ses composants (logiciel, design, contenu, marques) sont protégés par les lois 
                sur la propriété intellectuelle. Vous ne pouvez pas :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Copier, modifier ou distribuer notre logiciel</li>
                <li>Utiliser nos marques sans autorisation</li>
                <li>Créer des œuvres dérivées</li>
                <li>Effectuer de l'ingénierie inverse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Confidentialité et données</h2>
              <p className="mb-4">
                Votre utilisation du service est également régie par notre 
                <Link to="/privacy-policy" className="text-blue-200 hover:text-white underline">
                  Politique de Confidentialité
                </Link>, 
                qui fait partie intégrante de ces CGU.
              </p>
              <h3 className="text-xl font-medium mb-3">7.1 Vos données</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Vous conservez la propriété de vos données personnelles</li>
                <li>Vous nous accordez une licence pour traiter vos données selon notre politique</li>
                <li>Vous pouvez exporter ou supprimer vos données à tout moment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Disponibilité et maintenance</h2>
              <p className="mb-4">
                Nous nous efforçons de maintenir une disponibilité de 99,9% mais ne garantissons pas 
                un service ininterrompu. Nous pouvons effectuer :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Maintenances programmées (avec préavis)</li>
                <li>Maintenances d'urgence (sans préavis)</li>
                <li>Mises à jour et améliorations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitation de responsabilité</h2>
              <p className="mb-4">
                Dans la mesure permise par la loi :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Ordo est fourni "en l'état" sans garanties</li>
                <li>Nous ne sommes pas responsables des dommages indirects</li>
                <li>Notre responsabilité est limitée au montant payé pour le service</li>
                <li>Vous utilisez le service à vos propres risques</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Résiliation</h2>
              <h3 className="text-xl font-medium mb-3">10.1 Résiliation par vous</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Vous pouvez résilier votre compte à tout moment</li>
                <li>La résiliation prend effet à la fin de la période de facturation</li>
                <li>Vous pouvez exporter vos données avant la résiliation</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-3">10.2 Résiliation par nous</h3>
              <p className="mb-4">Nous pouvons suspendre ou résilier votre compte en cas de :</p>
              <ul className="list-disc ml-6 mb-4">
                <li>Violation de ces CGU</li>
                <li>Activité frauduleuse ou illégale</li>
                <li>Non-paiement des frais d'abonnement</li>
                <li>Inactivité prolongée (12 mois)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Modifications des CGU</h2>
              <p className="mb-4">
                Nous nous réservons le droit de modifier ces CGU. Les modifications importantes 
                vous seront notifiées par email au moins 30 jours à l'avance. Votre utilisation 
                continue du service constitue votre acceptation des nouvelles conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Droit applicable et juridiction</h2>
              <p className="mb-4">
                Ces CGU sont régies par le droit français. Tout litige sera soumis à la juridiction 
                exclusive des tribunaux de Paris, France.
              </p>
              <p className="mb-4">
                Avant tout recours judiciaire, nous nous engageons à rechercher une solution amiable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Divers</h2>
              <h3 className="text-xl font-medium mb-3">13.1 Intégralité</h3>
              <p className="mb-4">
                Ces CGU constituent l'intégralité de l'accord entre vous et Ordo.
              </p>
              
              <h3 className="text-xl font-medium mb-3">13.2 Divisibilité</h3>
              <p className="mb-4">
                Si une disposition est jugée invalide, les autres dispositions restent en vigueur.
              </p>
              
              <h3 className="text-xl font-medium mb-3">13.3 Renonciation</h3>
              <p className="mb-4">
                Le fait de ne pas faire valoir un droit ne constitue pas une renonciation à ce droit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
              <p className="mb-4">
                Pour toute question concernant ces conditions d'utilisation :
              </p>
              <ul className="list-disc ml-6 mb-4">
                <li>Email : <strong>legal@ordo-app.com</strong></li>
                <li>Adresse : Ordo SAS, 123 Avenue de l'Innovation, 75001 Paris, France</li>
                <li>Support : <strong>support@ordo-app.com</strong></li>
              </ul>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}