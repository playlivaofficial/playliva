import { geoEditorial } from './geo-editorial'
import { contentLocale } from '@/lib/locale'
import type { ContentLocale } from '@/lib/types'
import type { Locale } from './types'

/**
 * Localized long-form content for the static content & legal pages.
 *
 * Inline markup supported by the renderer:
 *   **bold**            -> <strong>
 *   [label](/internal)  -> next/link
 *   [label](https://…)  -> external anchor
 *   [label](mailto:…)   -> mail anchor
 *
 * Legal copy is a faithful translation of the reviewed English templates and
 * still requires local legal review before production (see `template` flag).
 */

export type LegalPageKey =
  | 'about'
  | 'responsible-gaming'
  | 'terms'
  | 'privacy-policy'
  | 'cookie-policy'
  | 'affiliate-disclosure'
  | 'contact'

interface Card {
  title: string
  text: string
}

interface Sect {
  h?: string
  body: string[]
}

interface LegalPage {
  eyebrow: string
  title: string
  description: string
  template?: boolean
  cards?: Card[]
  sections?: Sect[]
  /** Optional 18+ callout (responsible gaming). */
  ageCallout?: string
  /** Optional pair of CTA buttons (about page). */
  buttons?: { label: string; href: string; variant?: 'primary' | 'outline' }[]
}

type LegalContent = Record<ContentLocale, Record<LegalPageKey, LegalPage>>

export const LEGAL_CONTENT: LegalContent = {
  'pt-BR': {
    about: {
      eyebrow: 'Sobre',
      title: 'Sobre a PlayLiva',
      description:
        'Uma plataforma de descoberta de jogos criada para ajudar jogadores adultos a explorar entretenimento de cassino e apostas disponível no seu mercado.',
      cards: [
        {
          title: 'Descoberta',
          text: 'Ajudamos você a encontrar jogos populares e lançamentos em todas as categorias.',
        },
        {
          title: 'Comparação',
          text: 'Compare operadores disponíveis e suas ofertas em um só lugar.',
        },
        {
          title: 'Disponibilidade local',
          text: 'Veja opções que correspondem ao país e ao mercado selecionados.',
        },
        {
          title: 'Transparência',
          text: 'Somos claros sobre nosso modelo de afiliados e o jogo responsável.',
        },
      ],
      sections: [
        {
          h: 'O que a PlayLiva faz',
          body: [
            'A PlayLiva ajuda jogadores adultos a descobrir jogos, comparar operadores com disponibilidade verificada e explorar onde jogar no seu mercado. Focamos em uma experiência de descoberta limpa e moderna, e não na promoção agressiva de apostas.',
            'Nossa plataforma foi construída para ser multimercado desde a base. Jogadores em diferentes países podem ver operadores e ofertas relevantes para sua localização enquanto permanecem no mesmo site da PlayLiva.',
          ],
        },
        {
          h: 'O que a PlayLiva não é',
          body: [
            '**A PlayLiva não é um cassino nem um operador de apostas.** A PlayLiva não aceita apostas nem depósitos, não mantém saldos de usuários e não processa pagamentos. Ao escolher visitar um operador, você deixa a PlayLiva e passa a estar sujeito aos termos daquele operador e às regulamentações locais.',
          ],
        },
        {
          h: 'Responsável por princípio',
          body: [
            'Apostar envolve risco financeiro e deve ser tratado como entretenimento, não como forma de ganhar dinheiro. Nosso conteúdo é destinado a adultos maiores de 18 anos, e a disponibilidade depende da sua jurisdição. Saiba mais na nossa página de [Jogo Responsável](/responsible-gaming).',
          ],
        },
        {
          h: 'Como ganhamos dinheiro',
          body: [
            'A PlayLiva pode receber comissão quando os usuários visitam parceiros selecionados por meio de links neste site. Isso não afeta o preço nem a experiência oferecida aos usuários. Leia nossa [Divulgação de Afiliados](/affiliate-disclosure) para mais detalhes.',
          ],
        },
      ],
      buttons: [
        { label: 'Explorar jogos', href: '/games', variant: 'primary' },
        { label: 'Fale conosco', href: '/contact', variant: 'outline' },
      ],
    },
    'responsible-gaming': {
      eyebrow: 'Jogue com segurança',
      title: 'Jogue por diversão.',
      description:
        'Apostar envolve risco financeiro e deve ser tratado como entretenimento, não como forma de ganhar dinheiro. Jogue apenas com valores que você pode perder.',
      cards: [
        {
          title: 'Entretenimento, não renda',
          text: 'Apostar deve ser tratado como uma forma de entretenimento, nunca como um meio de ganhar dinheiro.',
        },
        {
          title: 'Nunca persiga perdas',
          text: 'Perseguir perdas tende a piorar as coisas. Se estiver perdendo, pare e faça uma pausa.',
        },
        {
          title: 'Defina limites com antecedência',
          text: 'Decida quanto tempo e dinheiro pode gastar antes de começar, e cumpra o combinado.',
        },
        {
          title: 'Nunca peça emprestado para jogar',
          text: 'Não aposte com dinheiro emprestado nem com recursos destinados a despesas essenciais.',
        },
        {
          title: 'Estritamente 18+',
          text: 'Apostas por menores são proibidas. Esta plataforma é destinada a adultos maiores de 18 anos.',
        },
        {
          title: 'Conheça sua jurisdição',
          text: 'A disponibilidade e a idade mínima para apostar dependem do seu país e das leis locais.',
        },
      ],
      sections: [
        {
          h: 'Como obter ajuda',
          body: [
            'Se o jogo deixar de ser divertido, ou se você estiver preocupado com o seu jogo ou o de outra pessoa, procure ajuda. Utilize os recursos oficiais de jogo responsável e autoexclusão disponíveis no seu país. Antes de escolher um operador, confira as ferramentas disponíveis para limites, pausas e autoexclusão; não pressuponha que os recursos sejam iguais em todos os países.',
            'A PlayLiva não aceita apostas nem depósitos e não pode aplicar limites ou autoexclusão em seu nome. Essas ferramentas são fornecidas diretamente pelos operadores e por organizações nacionais de apoio na sua jurisdição.',
          ],
        },
        {
          h: 'Uma nota sobre estratégias',
          body: [
            'Nenhum sistema ou estratégia de apostas pode garantir uma vitória. Os resultados dos jogos dependem do acaso. Desconfie de qualquer conteúdo que prometa resultados garantidos.',
          ],
        },
      ],
      ageCallout:
        'Você precisa ter 18 anos ou mais para apostar. Jogue com responsabilidade.',
    },
    terms: {
      eyebrow: 'Legal',
      title: 'Termos e Condições',
      description: 'Os termos que regem o uso da PlayLiva.',
      template: true,
      sections: [
        {
          h: 'Sobre a PlayLiva',
          body: [
            'A PlayLiva é um site informativo, de descoberta e de afiliados. **A PlayLiva não opera serviços de apostas**, não aceita apostas nem depósitos e não mantém saldos de usuários.',
          ],
        },
        {
          h: 'Operadores externos',
          body: [
            'Ao visitar um operador por meio da PlayLiva, você deixa o nosso site e passa a estar sujeito aos termos e condições, à política de privacidade e às promoções daquele operador. Não somos parte de nenhum acordo entre você e um operador.',
          ],
        },
        {
          h: 'Elegibilidade e legislação local',
          body: [
            'Você é responsável por garantir que apostar é legal na sua localização e que atende à idade mínima legal (18+). A disponibilidade de jogos e operadores varia por jurisdição.',
          ],
        },
        {
          h: 'Sem garantia de ganhos',
          body: [
            'Apostar envolve risco financeiro. Nada na PlayLiva deve ser interpretado como garantia de ganhos ou de um resultado específico. Os resultados dos jogos dependem do acaso.',
          ],
        },
        {
          h: 'Alterações de conteúdo',
          body: [
            'Conteúdo, listagens e ofertas podem mudar a qualquer momento sem aviso prévio. Buscamos precisão, mas não garantimos que todas as informações estejam completas ou atualizadas.',
          ],
        },
        {
          h: 'Relações de afiliados',
          body: [
            'A PlayLiva pode receber comissão de parceiros selecionados. Consulte nossa [Divulgação de Afiliados](/affiliate-disclosure) para mais detalhes.',
          ],
        },
        {
          h: 'Contato',
          body: [
            'Dúvidas sobre estes termos? Utilize nosso [formulário de contato](/contact).',
          ],
        },
      ],
    },
    'privacy-policy': {
      eyebrow: 'Legal',
      title: 'Política de Privacidade',
      description: 'Como tratamos as informações na PlayLiva.',
      template: true,
      sections: [
        {
          h: 'Informações que coletamos',
          body: [
            'Podemos coletar informações limitadas que você fornece diretamente (como mensagens enviadas pelo formulário de contato) e dados técnicos coletados automaticamente (como informações de dispositivo e navegador) para operar e melhorar o site.',
          ],
        },
        {
          h: 'Cookies',
          body: [
            'Usamos cookies e tecnologias semelhantes para funcionalidades essenciais, preferências e medição. Você pode gerenciar cookies não essenciais pelo nosso banner de cookies. Consulte nossa [Política de Cookies](/cookie-policy) para mais detalhes.',
          ],
        },
        {
          h: 'Análises',
          body: [
            'Podemos usar análises que respeitam a privacidade para entender como o site é utilizado de forma agregada. Isso nos ajuda a melhorar o conteúdo e o desempenho.',
          ],
        },
        {
          h: 'Rastreamento de afiliados',
          body: [
            'Quando você clica em um link de afiliado, nossos parceiros podem definir identificadores para atribuir indicações. Essa atividade é regida pela política de privacidade do próprio parceiro depois que você deixa a PlayLiva.',
          ],
        },
        {
          h: 'Seleção de país',
          body: [
            'O país/mercado selecionado pode ser armazenado no seu dispositivo para que possamos mostrar operadores e ofertas relevantes durante a sua sessão. Trata-se de uma preferência, não de um serviço de localização precisa.',
          ],
        },
        {
          h: 'Links de terceiros',
          body: [
            'A PlayLiva contém links para operadores e recursos de terceiros. Não somos responsáveis pelo conteúdo nem pelas práticas de privacidade de sites externos.',
          ],
        },
        {
          h: 'Seus direitos',
          body: [
            'Dependendo da sua jurisdição, você pode ter o direito de acessar, corrigir ou excluir seus dados pessoais e de se opor a determinados tratamentos. Entre em contato conosco para exercer esses direitos.',
          ],
        },
        {
          h: 'Contato',
          body: [
            'Dúvidas sobre privacidade? Envie um e-mail para [hello@playliva.com](mailto:hello@playliva.com) ou utilize nosso [formulário de contato](/contact).',
          ],
        },
      ],
    },
    'cookie-policy': {
      eyebrow: 'Legal',
      title: 'Política de Cookies',
      description: 'Como e por que a PlayLiva usa cookies.',
      template: true,
      cards: [
        {
          title: 'Necessários',
          text: 'Necessários para o funcionamento básico do site, como lembrar suas escolhas de cookies. Não podem ser desativados.',
        },
        {
          title: 'Preferências',
          text: 'Lembram configurações como o país/mercado selecionado para mostrarmos conteúdo relevante.',
        },
        {
          title: 'Análises',
          text: 'Ajudam a entender como o site é utilizado de forma agregada para que possamos melhorá-lo.',
        },
        {
          title: 'Afiliados',
          text: 'Apoiam a atribuição de indicações quando você acessa operadores parceiros.',
        },
      ],
      sections: [
        {
          h: 'Gerenciando suas preferências',
          body: [
            'Você pode aceitar todos os cookies, manter apenas os necessários ou gerenciar suas preferências pelo banner de cookies. Também é possível controlar os cookies pelas configurações do seu navegador a qualquer momento.',
          ],
        },
        {
          h: 'Cookies de terceiros',
          body: [
            'Quando você segue um link para um operador, esse terceiro pode definir seus próprios cookies, regidos por suas políticas. Consulte nossa [Política de Privacidade](/privacy-policy) para saber mais sobre como tratamos os dados.',
          ],
        },
      ],
    },
    'affiliate-disclosure': {
      eyebrow: 'Transparência',
      title: 'Divulgação de Afiliados',
      description: 'Acreditamos em ser claros sobre como a PlayLiva é financiada.',
      sections: [
        {
          body: [
            '**A PlayLiva pode receber remuneração quando visitantes clicam em links de afiliados ou se tornam clientes de parceiros selecionados.** Isso não afeta o preço nem a experiência oferecida aos usuários e não gera nenhum custo adicional para você.',
          ],
        },
        {
          h: 'Como funciona',
          body: [
            'Alguns links na PlayLiva são links de afiliados. Se você clicar em um e prosseguir com o cadastro ou uma transação com um operador, a PlayLiva pode receber comissão. As URLs de afiliados nunca são exibidas como texto puro — elas ficam sempre atrás de botões de ação claramente identificados.',
          ],
        },
        {
          h: 'Independência editorial',
          body: [
            'Relações comerciais não permitem que parceiros comprem alegações de posicionamento garantido. Nosso conteúdo de descoberta e comparação não deve ser interpretado como promessa de resultados garantidos, ganhos ou do "melhor" operador. Disponibilidade, ofertas e termos são definidos pelos operadores e variam por mercado.',
          ],
        },
        {
          h: 'Aprovação de operadores',
          body: [
            'Todos os operadores de dinheiro real devem ser revisados manualmente antes de aparecerem publicamente. Se você acredita que a listagem de um operador está incorreta, utilize nosso [formulário de contato](/contact) e selecione "Correção de operador".',
          ],
        },
        {
          h: 'Jogo responsável',
          body: [
            'Apostar envolve risco financeiro. Leia nossa página de [Jogo Responsável](/responsible-gaming) e jogue apenas com valores que você pode perder. 18+.',
          ],
        },
      ],
    },
    contact: {
      eyebrow: 'Contato',
      title: 'Fale conosco',
      description:
        'Dúvidas, parcerias ou correção de operador? Envie uma mensagem e retornaremos.',
      sections: [
        {
          h: 'Envie um e-mail',
          body: [
            'Prefere e-mail? Fale com a gente diretamente em [hello@playliva.com](mailto:hello@playliva.com).',
            'Para questões de jogo responsável, utilize também os recursos oficiais de apoio disponíveis no seu país.',
          ],
        },
      ],
    },
  },

  'es-MX': {
    about: {
      eyebrow: 'Acerca de',
      title: 'Acerca de PlayLiva',
      description:
        'Una plataforma de descubrimiento de juegos creada para ayudar a jugadores adultos a explorar el entretenimiento de casino y apuestas disponible en su mercado.',
      cards: [
        {
          title: 'Descubrimiento',
          text: 'Te ayudamos a encontrar juegos populares y lanzamientos en todas las categorías.',
        },
        {
          title: 'Comparación',
          text: 'Compara operadores disponibles y sus ofertas en un solo lugar.',
        },
        {
          title: 'Disponibilidad local',
          text: 'Consulta opciones que corresponden al país y al mercado seleccionados.',
        },
        {
          title: 'Transparencia',
          text: 'Somos claros sobre nuestro modelo de afiliados y el juego responsable.',
        },
      ],
      sections: [
        {
          h: 'Qué hace PlayLiva',
          body: [
            'PlayLiva ayuda a jugadores adultos a descubrir juegos, comparar operadores con disponibilidad verificada y explorar dónde jugar en su mercado. Nos enfocamos en una experiencia de descubrimiento limpia y moderna, no en la promoción agresiva de apuestas.',
            'Nuestra plataforma está construida para ser multimercado desde la base. Los jugadores de distintos países pueden ver operadores y ofertas relevantes para su ubicación sin salir del mismo sitio de PlayLiva.',
          ],
        },
        {
          h: 'Qué no es PlayLiva',
          body: [
            '**PlayLiva no es un casino ni un operador de apuestas.** PlayLiva no acepta apuestas ni depósitos, no mantiene saldos de usuarios y no procesa pagos. Cuando eliges visitar un operador, sales de PlayLiva y quedas sujeto a los términos de ese operador y a las regulaciones locales.',
          ],
        },
        {
          h: 'Responsable por diseño',
          body: [
            'Apostar implica riesgo financiero y debe tratarse como entretenimiento, no como una forma de ganar dinero. Nuestro contenido está dirigido a adultos mayores de 18 años, y la disponibilidad depende de tu jurisdicción. Conoce más en nuestra página de [Juego Responsable](/responsible-gaming).',
          ],
        },
        {
          h: 'Cómo ganamos dinero',
          body: [
            'PlayLiva puede ganar una comisión cuando los usuarios visitan socios seleccionados a través de enlaces en este sitio. Esto no afecta el precio ni la experiencia ofrecida a los usuarios. Lee nuestra [Divulgación de Afiliados](/affiliate-disclosure) para más detalles.',
          ],
        },
      ],
      buttons: [
        { label: 'Explorar juegos', href: '/games', variant: 'primary' },
        { label: 'Contáctanos', href: '/contact', variant: 'outline' },
      ],
    },
    'responsible-gaming': {
      eyebrow: 'Juega seguro',
      title: 'Juega por diversión.',
      description:
        'Apostar implica riesgo financiero y debe tratarse como entretenimiento, no como una forma de ganar dinero. Juega solo con dinero que puedas permitirte perder.',
      cards: [
        {
          title: 'Entretenimiento, no ingreso',
          text: 'Apostar debe tratarse como una forma de entretenimiento, nunca como una manera de ganar dinero.',
        },
        {
          title: 'Nunca persigas pérdidas',
          text: 'Perseguir pérdidas tiende a empeorar las cosas. Si estás perdiendo, detente y toma un descanso.',
        },
        {
          title: 'Fija límites de antemano',
          text: 'Decide cuánto tiempo y dinero puedes permitirte antes de empezar, y respétalo.',
        },
        {
          title: 'Nunca pidas prestado para jugar',
          text: 'No apuestes con dinero prestado ni con fondos destinados a gastos esenciales.',
        },
        {
          title: 'Estrictamente 18+',
          text: 'Las apuestas de menores están prohibidas. Esta plataforma está dirigida a adultos mayores de 18 años.',
        },
        {
          title: 'Conoce tu jurisdicción',
          text: 'La disponibilidad y la edad legal para apostar dependen de tu país y de las leyes locales.',
        },
      ],
      sections: [
        {
          h: 'Cómo obtener apoyo',
          body: [
            'Si el juego deja de ser divertido, o si te preocupa tu juego o el de otra persona, busca ayuda. Utiliza los recursos oficiales de juego responsable y autoexclusión disponibles en tu país. Antes de elegir un operador, comprueba sus herramientas de límites, pausas y autoexclusión; no supongas que sean iguales en todos los países.',
            'PlayLiva no acepta apuestas ni depósitos y no puede aplicar límites ni autoexclusión en tu nombre. Estas herramientas las proporcionan directamente los operadores y las organizaciones nacionales de apoyo en tu jurisdicción.',
          ],
        },
        {
          h: 'Una nota sobre estrategias',
          body: [
            'Ningún sistema o estrategia de apuestas puede garantizar una victoria. Los resultados de los juegos dependen del azar. Desconfía de cualquier contenido que prometa resultados garantizados.',
          ],
        },
      ],
      ageCallout:
        'Debes tener 18 años o más para apostar. Juega con responsabilidad.',
    },
    terms: {
      eyebrow: 'Legal',
      title: 'Términos y Condiciones',
      description: 'Los términos que rigen el uso de PlayLiva.',
      template: true,
      sections: [
        {
          h: 'Acerca de PlayLiva',
          body: [
            'PlayLiva es un sitio informativo, de descubrimiento y de afiliados. **PlayLiva no opera servicios de apuestas**, no acepta apuestas ni depósitos y no mantiene saldos de usuarios.',
          ],
        },
        {
          h: 'Operadores externos',
          body: [
            'Cuando visitas un operador a través de PlayLiva, sales de nuestro sitio y quedas sujeto a los términos y condiciones, la política de privacidad y las promociones de ese operador. No somos parte de ningún acuerdo entre tú y un operador.',
          ],
        },
        {
          h: 'Elegibilidad y ley local',
          body: [
            'Eres responsable de asegurarte de que apostar sea legal en tu ubicación y de que cumples con la edad legal mínima (18+). La disponibilidad de juegos y operadores varía según la jurisdicción.',
          ],
        },
        {
          h: 'Sin garantía de ganancias',
          body: [
            'Apostar implica riesgo financiero. Nada en PlayLiva debe interpretarse como una garantía de ganancias o de un resultado específico. Los resultados de los juegos dependen del azar.',
          ],
        },
        {
          h: 'Cambios de contenido',
          body: [
            'El contenido, los listados y las ofertas pueden cambiar en cualquier momento sin previo aviso. Buscamos precisión, pero no garantizamos que toda la información esté completa o actualizada.',
          ],
        },
        {
          h: 'Relaciones de afiliados',
          body: [
            'PlayLiva puede ganar comisión de socios seleccionados. Consulta nuestra [Divulgación de Afiliados](/affiliate-disclosure) para más detalles.',
          ],
        },
        {
          h: 'Contacto',
          body: [
            '¿Preguntas sobre estos términos? Utiliza nuestro [formulario de contacto](/contact).',
          ],
        },
      ],
    },
    'privacy-policy': {
      eyebrow: 'Legal',
      title: 'Política de Privacidad',
      description: 'Cómo tratamos la información en PlayLiva.',
      template: true,
      sections: [
        {
          h: 'Información que recopilamos',
          body: [
            'Podemos recopilar información limitada que proporcionas directamente (como los mensajes enviados a través de nuestro formulario de contacto) y datos técnicos recopilados automáticamente (como información del dispositivo y del navegador) para operar y mejorar el sitio.',
          ],
        },
        {
          h: 'Cookies',
          body: [
            'Usamos cookies y tecnologías similares para funcionalidades esenciales, preferencias y medición. Puedes gestionar las cookies no esenciales mediante nuestro banner de cookies. Consulta nuestra [Política de Cookies](/cookie-policy) para más detalles.',
          ],
        },
        {
          h: 'Analítica',
          body: [
            'Podemos usar analítica respetuosa con la privacidad para entender cómo se utiliza el sitio de forma agregada. Esto nos ayuda a mejorar el contenido y el rendimiento.',
          ],
        },
        {
          h: 'Rastreo de afiliados',
          body: [
            'Cuando haces clic en un enlace de afiliado, nuestros socios pueden establecer identificadores para atribuir referencias. Esta actividad se rige por la política de privacidad del propio socio una vez que sales de PlayLiva.',
          ],
        },
        {
          h: 'Selección de país',
          body: [
            'El país/mercado que seleccionas puede almacenarse en tu dispositivo para mostrarte operadores y ofertas relevantes durante tu sesión. Es una preferencia, no un servicio de ubicación precisa.',
          ],
        },
        {
          h: 'Enlaces de terceros',
          body: [
            'PlayLiva enlaza a operadores y recursos de terceros. No somos responsables del contenido ni de las prácticas de privacidad de sitios externos.',
          ],
        },
        {
          h: 'Tus derechos',
          body: [
            'Según tu jurisdicción, puedes tener derecho a acceder, corregir o eliminar tus datos personales, y a oponerte a ciertos tratamientos. Contáctanos para ejercer estos derechos.',
          ],
        },
        {
          h: 'Contacto',
          body: [
            '¿Preguntas sobre privacidad? Escribe a [hello@playliva.com](mailto:hello@playliva.com) o utiliza nuestro [formulario de contacto](/contact).',
          ],
        },
      ],
    },
    'cookie-policy': {
      eyebrow: 'Legal',
      title: 'Política de Cookies',
      description: 'Cómo y por qué PlayLiva usa cookies.',
      template: true,
      cards: [
        {
          title: 'Necesarias',
          text: 'Necesarias para el funcionamiento básico del sitio, como recordar tus elecciones de cookies. No se pueden desactivar.',
        },
        {
          title: 'Preferencias',
          text: 'Recuerdan ajustes como el país/mercado seleccionado para mostrarte contenido relevante.',
        },
        {
          title: 'Analítica',
          text: 'Nos ayudan a entender cómo se usa el sitio de forma agregada para poder mejorarlo.',
        },
        {
          title: 'Afiliados',
          text: 'Apoyan la atribución de referencias cuando accedes a operadores socios.',
        },
      ],
      sections: [
        {
          h: 'Gestionar tus preferencias',
          body: [
            'Puedes aceptar todas las cookies, mantener solo las necesarias o gestionar tus preferencias mediante el banner de cookies. También puedes controlar las cookies desde los ajustes de tu navegador en cualquier momento.',
          ],
        },
        {
          h: 'Cookies de terceros',
          body: [
            'Cuando sigues un enlace a un operador, ese tercero puede establecer sus propias cookies regidas por sus políticas. Consulta nuestra [Política de Privacidad](/privacy-policy) para saber más sobre cómo tratamos los datos.',
          ],
        },
      ],
    },
    'affiliate-disclosure': {
      eyebrow: 'Transparencia',
      title: 'Divulgación de Afiliados',
      description: 'Creemos en ser claros sobre cómo se financia PlayLiva.',
      sections: [
        {
          body: [
            '**PlayLiva puede recibir compensación cuando los visitantes hacen clic en enlaces de afiliados o se convierten en clientes de socios seleccionados.** Esto no afecta el precio ni la experiencia ofrecida a los usuarios y no genera ningún costo adicional para ti.',
          ],
        },
        {
          h: 'Cómo funciona',
          body: [
            'Algunos enlaces en PlayLiva son enlaces de afiliados. Si haces clic en uno y luego te registras o realizas una transacción con un operador, PlayLiva puede ganar una comisión. Las URL de afiliados nunca se muestran como texto plano — siempre están detrás de botones de acción claramente identificados.',
          ],
        },
        {
          h: 'Independencia editorial',
          body: [
            'Las relaciones comerciales no permiten que los socios compren afirmaciones de posicionamiento garantizado. Nuestro contenido de descubrimiento y comparación no debe interpretarse como una promesa de resultados garantizados, ganancias o del "mejor" operador. La disponibilidad, las ofertas y los términos los definen los operadores y varían según el mercado.',
          ],
        },
        {
          h: 'Aprobación de operadores',
          body: [
            'Todos los operadores de dinero real deben revisarse manualmente antes de aparecer públicamente. Si crees que el listado de un operador es inexacto, utiliza nuestro [formulario de contacto](/contact) y selecciona "Corrección de operador".',
          ],
        },
        {
          h: 'Juego responsable',
          body: [
            'Apostar implica riesgo financiero. Lee nuestra página de [Juego Responsable](/responsible-gaming) y juega solo con dinero que puedas permitirte perder. 18+.',
          ],
        },
      ],
    },
    contact: {
      eyebrow: 'Contacto',
      title: 'Contáctanos',
      description:
        '¿Preguntas, alianzas o corrección de operador? Envíanos un mensaje y te responderemos.',
      sections: [
        {
          h: 'Escríbenos por correo',
          body: [
            '¿Prefieres el correo? Escríbenos directamente a [hello@playliva.com](mailto:hello@playliva.com).',
            'Para temas de juego responsable, utiliza también los recursos oficiales de apoyo disponibles en tu país.',
          ],
        },
      ],
    },
  },

  en: {
    about: {
      eyebrow: 'About',
      title: 'About PlayLiva',
      description:
        'A game discovery platform built to help adult players explore the casino and betting entertainment available in their market.',
      cards: [
        {
          title: 'Discovery',
          text: 'We help you find popular games and new releases across every category.',
        },
        {
          title: 'Comparison',
          text: 'Compare available operators and their offers in one place.',
        },
        {
          title: 'Local availability',
          text: 'See options that match the selected country and market.',
        },
        {
          title: 'Transparency',
          text: 'We are upfront about our affiliate model and responsible gaming.',
        },
      ],
      sections: [
        {
          h: 'What PlayLiva does',
          body: [
            "PlayLiva helps adult players discover games, compare operators with verified availability and explore where to play in their market. We focus on a clean, modern discovery experience rather than aggressive betting promotion.",
            'Our platform was built to be multi-market from the ground up. Players in different countries can see operators and offers relevant to their location while staying on the same PlayLiva site.',
          ],
        },
        {
          h: 'What PlayLiva is not',
          body: [
            "**PlayLiva is not a casino or a betting operator.** PlayLiva doesn't accept bets or deposits, doesn't hold user balances, and doesn't process payments. When you choose to visit an operator, you leave PlayLiva and become subject to that operator's terms and local regulations.",
          ],
        },
        {
          h: 'Responsible by design',
          body: [
            'Betting involves financial risk and should be treated as entertainment, not a way to make money. Our content is intended for adults 18 and over, and availability depends on your jurisdiction. Learn more on our [Responsible Gaming](/responsible-gaming) page.',
          ],
        },
        {
          h: 'How we make money',
          body: [
            'PlayLiva may earn a commission when users visit selected partners through links on this site. This does not affect the price or experience offered to users. Read our [Affiliate Disclosure](/affiliate-disclosure) for more details.',
          ],
        },
      ],
      buttons: [
        { label: 'Explore games', href: '/games', variant: 'primary' },
        { label: 'Contact us', href: '/contact', variant: 'outline' },
      ],
    },
    'responsible-gaming': {
      eyebrow: 'Play safely',
      title: 'Play for fun.',
      description:
        'Betting involves financial risk and should be treated as entertainment, not a way to make money. Only play with money you can afford to lose.',
      cards: [
        {
          title: 'Entertainment, not income',
          text: 'Betting should be treated as a form of entertainment, never as a way to make money.',
        },
        {
          title: 'Never chase losses',
          text: "Chasing losses tends to make things worse. If you're losing, stop and take a break.",
        },
        {
          title: 'Set limits in advance',
          text: 'Decide how much time and money you can afford before you start, and stick to it.',
        },
        {
          title: 'Never borrow to play',
          text: "Don't bet with borrowed money or funds set aside for essential expenses.",
        },
        {
          title: 'Strictly 18+',
          text: 'Underage betting is prohibited. This platform is intended for adults 18 and over.',
        },
        {
          title: 'Know your jurisdiction',
          text: 'Availability and the legal betting age depend on your country and local laws.',
        },
      ],
      sections: [
        {
          h: 'How to get support',
          body: [
            "If gaming stops being fun, or you're worried about your own play or someone else's, seek help. Use the official responsible gaming and self-exclusion resources available in your country. Before choosing an operator, check its deposit limits, timeouts and self-exclusion tools; do not assume the same tools are available in every country.",
            "PlayLiva doesn't accept bets or deposits and cannot apply limits or self-exclusion on your behalf. These tools are provided directly by operators and by national support organizations in your jurisdiction.",
          ],
        },
        {
          h: 'A note on strategies',
          body: [
            'No betting system or strategy can guarantee a win. Game outcomes depend on chance. Be wary of any content that promises guaranteed results.',
          ],
        },
      ],
      ageCallout: 'You must be 18 or older to bet. Play responsibly.',
    },
    terms: {
      eyebrow: 'Legal',
      title: 'Terms & Conditions',
      description: 'The terms that govern use of PlayLiva.',
      template: true,
      sections: [
        {
          h: 'About PlayLiva',
          body: [
            "PlayLiva is an informational, discovery and affiliate website. **PlayLiva doesn't operate betting services**, doesn't accept bets or deposits, and doesn't hold user balances.",
          ],
        },
        {
          h: 'Third-party operators',
          body: [
            "When you visit an operator through PlayLiva, you leave our site and become subject to that operator's terms and conditions, privacy policy and promotions. We are not party to any agreement between you and an operator.",
          ],
        },
        {
          h: 'Eligibility and local law',
          body: [
            'You are responsible for ensuring that betting is legal in your location and that you meet the minimum legal age (18+). Game and operator availability varies by jurisdiction.',
          ],
        },
        {
          h: 'No guarantee of winnings',
          body: [
            'Betting involves financial risk. Nothing on PlayLiva should be interpreted as a guarantee of winnings or a specific outcome. Game outcomes depend on chance.',
          ],
        },
        {
          h: 'Content changes',
          body: [
            'Content, listings and offers may change at any time without notice. We strive for accuracy but do not guarantee that all information is complete or up to date.',
          ],
        },
        {
          h: 'Affiliate relationships',
          body: [
            'PlayLiva may earn a commission from selected partners. See our [Affiliate Disclosure](/affiliate-disclosure) for more details.',
          ],
        },
        {
          h: 'Contact',
          body: [
            'Questions about these terms? Use our [contact form](/contact).',
          ],
        },
      ],
    },
    'privacy-policy': {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      description: 'How we handle information on PlayLiva.',
      template: true,
      sections: [
        {
          h: 'Information we collect',
          body: [
            'We may collect limited information you provide directly (such as messages sent through our contact form) and technical data collected automatically (such as device and browser information) to operate and improve the site.',
          ],
        },
        {
          h: 'Cookies',
          body: [
            'We use cookies and similar technologies for essential functionality, preferences and measurement. You can manage non-essential cookies through our cookie banner. See our [Cookie Policy](/cookie-policy) for more details.',
          ],
        },
        {
          h: 'Analytics',
          body: [
            'We may use privacy-respecting analytics to understand how the site is used in aggregate. This helps us improve content and performance.',
          ],
        },
        {
          h: 'Affiliate tracking',
          body: [
            'When you click an affiliate link, our partners may set identifiers to attribute referrals. This activity is governed by that partner\'s own privacy policy once you leave PlayLiva.',
          ],
        },
        {
          h: 'Country selection',
          body: [
            'The country/market you select may be stored on your device so we can show relevant operators and offers during your session. This is a preference, not a precise location service.',
          ],
        },
        {
          h: 'Third-party links',
          body: [
            "PlayLiva contains links to third-party operators and resources. We are not responsible for the content or privacy practices of external sites.",
          ],
        },
        {
          h: 'Your rights',
          body: [
            'Depending on your jurisdiction, you may have the right to access, correct or delete your personal data, and to object to certain processing. Contact us to exercise these rights.',
          ],
        },
        {
          h: 'Contact',
          body: [
            'Questions about privacy? Email [hello@playliva.com](mailto:hello@playliva.com) or use our [contact form](/contact).',
          ],
        },
      ],
    },
    'cookie-policy': {
      eyebrow: 'Legal',
      title: 'Cookie Policy',
      description: 'How and why PlayLiva uses cookies.',
      template: true,
      cards: [
        {
          title: 'Necessary',
          text: "Required for the site's basic operation, such as remembering your cookie choices. These cannot be turned off.",
        },
        {
          title: 'Preferences',
          text: 'Remember settings like the selected country/market so we can show relevant content.',
        },
        {
          title: 'Analytics',
          text: 'Help us understand how the site is used in aggregate so we can improve it.',
        },
        {
          title: 'Affiliate',
          text: 'Support referral attribution when you access partner operators.',
        },
      ],
      sections: [
        {
          h: 'Managing your preferences',
          body: [
            'You can accept all cookies, keep only the necessary ones, or manage your preferences through the cookie banner. You can also control cookies from your browser settings at any time.',
          ],
        },
        {
          h: 'Third-party cookies',
          body: [
            "When you follow a link to an operator, that third party may set its own cookies, governed by its own policies. See our [Privacy Policy](/privacy-policy) to learn more about how we handle data.",
          ],
        },
      ],
    },
    'affiliate-disclosure': {
      eyebrow: 'Transparency',
      title: 'Affiliate Disclosure',
      description: 'We believe in being upfront about how PlayLiva is funded.',
      sections: [
        {
          body: [
            '**PlayLiva may receive compensation when visitors click affiliate links or become customers of selected partners.** This does not affect the price or experience offered to users and creates no extra cost to you.',
          ],
        },
        {
          h: 'How it works',
          body: [
            "Some links on PlayLiva are affiliate links. If you click one and go on to register or transact with an operator, PlayLiva may earn a commission. Affiliate URLs are never shown as plain text — they always sit behind clearly labeled action buttons.",
          ],
        },
        {
          h: 'Editorial independence',
          body: [
            'Commercial relationships do not let partners buy guaranteed-placement claims. Our discovery and comparison content should not be interpreted as a promise of guaranteed results, winnings or the "best" operator. Availability, offers and terms are set by operators and vary by market.',
          ],
        },
        {
          h: 'Operator approval',
          body: [
            'All real-money operators must be manually reviewed before appearing publicly. If you believe an operator listing is inaccurate, use our [contact form](/contact) and select "Operator correction".',
          ],
        },
        {
          h: 'Responsible gaming',
          body: [
            'Betting involves financial risk. Read our [Responsible Gaming](/responsible-gaming) page and only play with money you can afford to lose. 18+.',
          ],
        },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Contact us',
      description:
        'Questions, partnerships or an operator correction? Send us a message and we will get back to you.',
      sections: [
        {
          h: 'Email us',
          body: [
            'Prefer email? Reach us directly at [hello@playliva.com](mailto:hello@playliva.com).',
            'For responsible gaming concerns, also use the official support resources available in your country.',
          ],
        },
      ],
    },
  },
}

export function getLegalPage(key: LegalPageKey, locale: Locale): LegalPage {
  const page = LEGAL_CONTENT[contentLocale(locale)][key]
  const country = geoEditorial(locale)
  if (!country || !['responsible-gaming', 'affiliate-disclosure'].includes(key)) return page
  return { ...page, sections: [...(page.sections ?? []), {
    h: `Información para ${country.name}`,
    body: [country.responsible, country.money, 'La disponibilidad comercial depende de la ubicación de la visita y de la aprobación del operador para ese país. Una relación de afiliación no acredita por sí sola una autorización legal; PlayLiva no publica afirmaciones de licencia sin una fuente verificada.'],
  }] }
}
