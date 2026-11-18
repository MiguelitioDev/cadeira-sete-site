import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

const ler = (arquivo: string) => JSON.parse(readFileSync(new URL(`./src/content/${arquivo}`, import.meta.url), 'utf8'))
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * SEO local montado a partir do conteúdo que o painel edita:
 * título "Barbearia em <cidade> (<bairro>)", descrição com serviços e preços, Open Graph e JSON-LD BarberShop.
 * Assim, quando o dono muda endereço ou preço, o SEO muda junto no próximo deploy.
 */
function seoLocal(): Plugin {
  let siteUrlEnv = ''
  return {
    name: 'seo-local',
    // Lê VITE_SITE_URL do .env.production ou da variável da Vercel (a da Vercel vence).
    configResolved(config) {
      siteUrlEnv = String(config.env.VITE_SITE_URL || '')
    },
    transformIndexHtml(html) {
      const b = ler('barbearia.json')
      const servicos = (ler('servicos.json') as { nome: string; preco: number; descricao: string; ativo: boolean }[]).filter((s) => s.ativo !== false)
      const cidade = b.cidade.split(',')[0].trim()
      const siteUrl = siteUrlEnv.replace(/\/$/, '')
      const titulo = `Barbearia em ${cidade} (${b.bairro}) · ${b.nome}`
      const menor = Math.min(...servicos.map((s) => s.preco))
      const [principal, ...outros] = servicos
      const resto = outros.length > 1 ? ` e outros ${outros.length - 1} serviços` : ''
      const descricao = `${b.nome}, barbearia no ${b.bairro} de ${cidade}. ${principal.nome} por R$ ${principal.preco}${
        outros[0] ? `, ${outros[0].nome.toLowerCase()}${resto}` : ''
      }. Agende pelo site em menos de um minuto.`
      const dias = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BarberShop',
        name: `${b.nome} ${b.complemento}`,
        description: b.sobre,
        ...(siteUrl && { url: siteUrl, image: `${siteUrl}/images/galeria/salao.webp` }),
        telephone: `+${b.whatsapp}`,
        priceRange: `R$ ${menor}–${Math.max(...servicos.map((s) => s.preco))}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: b.endereco,
          addressLocality: cidade,
          addressRegion: b.cidade.split(',')[1]?.trim() || '',
          addressCountry: 'BR',
        },
        sameAs: [`https://instagram.com/${b.instagram}`],
        openingHoursSpecification: (b.horarios as { dia: number; aberto: boolean; abre: string; fecha: string }[])
          .filter((h) => h.aberto)
          .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dias[h.dia], opens: h.abre, closes: h.fecha })),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Serviços',
          itemListElement: servicos.map((s) => ({
            '@type': 'Offer',
            price: s.preco,
            priceCurrency: 'BRL',
            itemOffered: { '@type': 'Service', name: s.nome, description: s.descricao },
          })),
        },
      }
      const cabeca = [
        `<title>${esc(titulo)}</title>`,
        `<meta name="description" content="${esc(descricao)}" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:locale" content="pt_BR" />`,
        `<meta property="og:title" content="${esc(titulo)}" />`,
        `<meta property="og:description" content="${esc(descricao)}" />`,
        siteUrl && `<meta property="og:image" content="${siteUrl}/images/galeria/salao.webp" />`,
        siteUrl && `<link rel="canonical" href="${siteUrl}/" />`,
        `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
      ]
        .filter(Boolean)
        .join('\n    ')
      return html.replace(/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, cabeca)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoLocal()],
  server: { port: 5173 },
})
