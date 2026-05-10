export type Locale = "fr" | "ar" | "en";

export interface CakeTranslation {
  title: string;
  description: string;
}

export interface Cake {
  id: string;
  slug: string;
  images: string[];
  category: string;
  categoryLabel: Record<Locale, string>;
  translations: Record<Locale, CakeTranslation>;
  length?: number;
  width?: number;
  height?: number;
  pieces?: number;
  persons?: number;
  featured: boolean;
}

export const CAKES: Cake[] = [
  {
    id: "cake-1",
    slug: "gateau-cocomelon",
    images: [
      "/images/Cake1/FB_IMG_1778412877519.jpg",
      "/images/Cake1/FB_IMG_1778412893312.jpg",
      "/images/Cake1/FB_IMG_1778412896351.jpg",
      "/images/Cake1/FB_IMG_1778412913118.jpg",
    ],
    category: "birthday-kids",
    categoryLabel: { fr: "Anniversaire Enfants", ar: "عيد ميلاد الأطفال", en: "Kids Birthday" },
    translations: {
      fr: {
        title: "Gâteau CoComelon",
        description: "Un gâteau d'anniversaire enchanteur sur le thème de CoComelon, idéal pour les tout-petits. Décoré avec les personnages adorés de la série, ce gâteau est recouvert d'un glaçage lisse et agrémenté de points colorés et de figurines en sucre. Une création unique qui fera briller les yeux de votre enfant.",
      },
      ar: {
        title: "كعكة كوكوميلون",
        description: "كعكة عيد ميلاد رائعة بثيمة كوكوميلون، مثالية للأطفال الصغار. مزينة بشخصيات المسلسل المحبوبة، مغطاة بالكريمة الناعمة مع نقاط ملونة وأشكال السكر. إبداع فريد سيُبهر طفلك.",
      },
      en: {
        title: "CoComelon Cake",
        description: "A delightful birthday cake on the CoComelon theme, perfect for toddlers. Decorated with the beloved characters from the series, this cake is covered in smooth icing and adorned with colorful dots and sugar figurines. A unique creation that will make your child's eyes light up.",
      },
    },
    length: 25,
    width: 25,
    height: 12,
    pieces: 16,
    persons: 12,
    featured: true,
  },
  {
    id: "cake-2",
    slug: "gateau-elegant",
    images: [
      "/images/Cake2/FB_IMG_1778412946778.jpg",
      "/images/Cake2/FB_IMG_1778412963094.jpg",
      "/images/Cake2/FB_IMG_1778412973312.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Élégance Dorée",
        description: "Une création sophistiquée pour un anniversaire adulte, alliant élégance et raffinement. Ce gâteau aux finitions dorées est parfait pour célébrer les grandes occasions avec style. Chaque détail est soigneusement travaillé pour offrir un résultat à la hauteur de vos attentes.",
      },
      ar: {
        title: "كعكة الأناقة الذهبية",
        description: "إبداع راقٍ لعيد ميلاد البالغين، يجمع بين الأناقة والرقي. هذه الكعكة بالتشطيبات الذهبية مثالية للاحتفال بالمناسبات الكبرى بأسلوب راقٍ. كل تفصيل مُعالَج بعناية لتقديم نتيجة ترقى لتوقعاتك.",
      },
      en: {
        title: "Golden Elegance Cake",
        description: "A sophisticated creation for an adult birthday, combining elegance and refinement. This cake with golden finishes is perfect for celebrating special occasions in style. Every detail is carefully crafted to deliver results that meet your highest expectations.",
      },
    },
    length: 30,
    width: 30,
    height: 14,
    pieces: 20,
    persons: 16,
    featured: false,
  },
  {
    id: "cake-3",
    slug: "gateau-mama",
    images: [
      "/images/Cake3/FB_IMG_1778412989942.jpg",
      "/images/Cake3/FB_IMG_1778412997711.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau أمي — Hommage à Maman",
        description: "Un gâteau tendre et émouvant créé en hommage aux mamans. Orné d'une figurine en fondant représentant une femme en prière sur un tapis, avec l'inscription 'أمي' (ma maman) en rouge. Fleuri de petites fleurs délicates, ce gâteau exprime tout l'amour pour la personne la plus précieuse de votre vie.",
      },
      ar: {
        title: "كعكة أمي",
        description: "كعكة حنونة ومؤثرة أُعدَّت تكريماً للأمهات. مزينة بشخصية فوندان تمثل امرأة تصلي على سجادة، مع كتابة 'أمي' باللون الأحمر. مزيَّنة بزهور صغيرة رقيقة، هذه الكعكة تعبر عن كل المحبة لأغلى شخص في حياتك.",
      },
      en: {
        title: "Mama Tribute Cake",
        description: "A tender and moving cake created as a tribute to mothers. Adorned with a fondant figure of a woman praying on a rug, with the inscription 'أمي' (my mother) in red. Decorated with small delicate flowers, this cake expresses all the love for the most precious person in your life.",
      },
    },
    length: 22,
    width: 22,
    height: 10,
    pieces: 12,
    persons: 10,
    featured: true,
  },
  {
    id: "cake-4",
    slug: "gateau-degrade",
    images: [
      "/images/Cake4/FB_IMG_1778413022968.jpg",
      "/images/Cake4/FB_IMG_1778413029337.jpg",
      "/images/Cake4/FB_IMG_1778413033806.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Dégradé Pastel",
        description: "Un gâteau moderne et tendance aux tons pastel en dégradé. Ses finitions lisses et ses couleurs douces en font une pièce maîtresse visuelle pour tout type de célébration. Simple dans sa forme mais sophistiqué dans son exécution, il séduit autant les yeux que les papilles.",
      },
      ar: {
        title: "كعكة التدرج الباستيل",
        description: "كعكة عصرية وأنيقة بألوان الباستيل المتدرجة. تشطيباتها الناعمة وألوانها الهادئة تجعلها محور اهتمام بصري لأي نوع من الاحتفالات. بسيطة في شكلها لكن متطورة في تنفيذها.",
      },
      en: {
        title: "Pastel Gradient Cake",
        description: "A modern and trendy cake with pastel gradient tones. Its smooth finishes and soft colors make it a visual centerpiece for any type of celebration. Simple in form yet sophisticated in execution, it delights both the eyes and the palate.",
      },
    },
    length: 20,
    width: 20,
    height: 15,
    pieces: 14,
    persons: 10,
    featured: false,
  },
  {
    id: "cake-5",
    slug: "gateau-floral-rose",
    images: [
      "/images/Cake5/FB_IMG_1778413047112.jpg",
      "/images/Cake5/FB_IMG_1778413055086.jpg",
    ],
    category: "wedding",
    categoryLabel: { fr: "Mariage & Fiançailles", ar: "زفاف وخطوبة", en: "Wedding & Engagement" },
    translations: {
      fr: {
        title: "Gâteau Floral Romantique",
        description: "Une création romantique et délicate pour les grandes occasions. Ce gâteau est sublimé par des fleurs en sucre minutieusement sculptées et disposées avec art. Parfait pour un mariage, des fiançailles ou un anniversaire romantique, il incarne l'élégance naturelle et la douceur du moment.",
      },
      ar: {
        title: "كعكة الورود الرومانسية",
        description: "إبداع رومانسي ورقيق للمناسبات الكبرى. هذه الكعكة تتجمل بزهور السكر المنحوتة بدقة والمرتبة بفنية. مثالية للزفاف أو الخطوبة أو عيد الميلاد الرومانسي، تجسد الأناقة الطبيعية وحلاوة اللحظة.",
      },
      en: {
        title: "Romantic Floral Cake",
        description: "A romantic and delicate creation for special occasions. This cake is enhanced by meticulously sculpted sugar flowers arranged with artistry. Perfect for a wedding, engagement or romantic anniversary, it embodies natural elegance and the sweetness of the moment.",
      },
    },
    length: 28,
    width: 28,
    height: 16,
    pieces: 18,
    persons: 15,
    featured: false,
  },
  {
    id: "cake-6",
    slug: "gateau-anniversaire-fete",
    images: [
      "/images/Cake6/FB_IMG_1778413108324.jpg",
      "/images/Cake6/FB_IMG_1778413112277.jpg",
      "/images/Cake6/FB_IMG_1778413115411.jpg",
      "/images/Cake6/FB_IMG_1778413119862.jpg",
    ],
    category: "birthday-kids",
    categoryLabel: { fr: "Anniversaire Enfants", ar: "عيد ميلاد الأطفال", en: "Kids Birthday" },
    translations: {
      fr: {
        title: "Gâteau Fête Arc-en-Ciel",
        description: "Un gâteau festif et coloré qui apporte joie et gaieté à chaque fête d'anniversaire. Ses couleurs vives et ses décorations joyeuses captivent petits et grands. Conçu pour créer des souvenirs inoubliables, ce gâteau est une véritable explosion de bonheur sucré.",
      },
      ar: {
        title: "كعكة قوس قزح الاحتفالية",
        description: "كعكة احتفالية ملونة تجلب الفرح والبهجة لكل حفلة عيد ميلاد. ألوانها الزاهية وزيناتها المبهجة تأسر الصغار والكبار. صُممت لخلق ذكريات لا تُنسى.",
      },
      en: {
        title: "Rainbow Party Cake",
        description: "A festive and colorful cake that brings joy and cheer to every birthday party. Its vibrant colors and cheerful decorations captivate children and adults alike. Designed to create unforgettable memories, this cake is a true explosion of sweet happiness.",
      },
    },
    length: 24,
    width: 24,
    height: 12,
    pieces: 16,
    persons: 12,
    featured: false,
  },
  {
    id: "cake-7",
    slug: "gateau-princesse",
    images: [
      "/images/Cake7/FB_IMG_1778413136978.jpg",
      "/images/Cake7/FB_IMG_1778413140086.jpg",
      "/images/Cake7/FB_IMG_1778413143084.jpg",
      "/images/Cake7/FB_IMG_1778413145654.jpg",
      "/images/Cake7/FB_IMG_1778413148725.jpg",
    ],
    category: "birthday-kids",
    categoryLabel: { fr: "Anniversaire Filles", ar: "عيد ميلاد البنات", en: "Girls Birthday" },
    translations: {
      fr: {
        title: "Gâteau Princesse Couronnée",
        description: "Un gâteau de rêve pour votre petite princesse ! Décoré d'une tiare en fondant violet, de fleurs délicates et de perles dorées, ce gâteau rose poudré est une véritable féerie. Avec l'inscription du prénom de votre enfant, il devient une pièce unique et mémorable pour son grand jour.",
      },
      ar: {
        title: "كعكة الأميرة المتوَّجة",
        description: "كعكة أحلام لأميرتك الصغيرة! مزينة بتاج فوندان بنفسجي وزهور رقيقة وخرزات ذهبية، هذه الكعكة الوردية الهادئة سحر حقيقي. مع كتابة اسم طفلتك، تصبح قطعة فريدة لا تُنسى ليومها الكبير.",
      },
      en: {
        title: "Crowned Princess Cake",
        description: "A dream cake for your little princess! Decorated with a purple fondant tiara, delicate flowers and golden pearls, this powder-pink cake is pure enchantment. With your child's name written on it, it becomes a unique and memorable piece for her special day.",
      },
    },
    length: 22,
    width: 22,
    height: 14,
    pieces: 14,
    persons: 10,
    featured: true,
  },
  {
    id: "cake-8",
    slug: "gateau-luxe-blanc",
    images: [
      "/images/Cake8/FB_IMG_1778413176810.jpg",
      "/images/Cake8/FB_IMG_1778413180094.jpg",
      "/images/Cake8/FB_IMG_1778413183023.jpg",
      "/images/Cake8/FB_IMG_1778413186037.jpg",
    ],
    category: "wedding",
    categoryLabel: { fr: "Mariage & Fiançailles", ar: "زفاف وخطوبة", en: "Wedding & Engagement" },
    translations: {
      fr: {
        title: "Gâteau Luxe Blanc Ivoire",
        description: "L'incarnation du luxe et de la pureté pour votre mariage. Ce gâteau blanc ivoire aux finitions impeccables est orné de détails fins et de textures délicates. Sa sobriété élégante le rend intemporel et adapté aux cérémonies les plus prestigieuses.",
      },
      ar: {
        title: "كعكة الفخامة البيضاء العاجية",
        description: "تجسيد الفخامة والنقاء لزفافك. هذه الكعكة العاجية ذات التشطيبات المثالية مزينة بتفاصيل دقيقة وملمسات رقيقة. أناقتها المتحفظة تجعلها خارج الزمن ومناسبة لأكثر المناسبات رقياً.",
      },
      en: {
        title: "Ivory White Luxury Cake",
        description: "The embodiment of luxury and purity for your wedding. This ivory white cake with impeccable finishes is adorned with fine details and delicate textures. Its elegant sobriety makes it timeless and suited to the most prestigious ceremonies.",
      },
    },
    length: 35,
    width: 35,
    height: 20,
    pieces: 30,
    persons: 25,
    featured: false,
  },
  {
    id: "cake-9",
    slug: "gateau-moderne-chic",
    images: [
      "/images/Cake9/FB_IMG_1778413218708.jpg",
      "/images/Cake9/FB_IMG_1778413224460.jpg",
      "/images/Cake9/FB_IMG_1778413230416.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Moderne & Chic",
        description: "Un design épuré et contemporain pour les amateurs de modernité. Ce gâteau au style minimaliste chic combine des textures lisses et des accents dorés pour un rendu sophistiqué. Idéal pour les personnes au goût affirmé qui recherchent l'excellence dans chaque détail.",
      },
      ar: {
        title: "كعكة عصرية وأنيقة",
        description: "تصميم أنيق ومعاصر لعشاق الحداثة. هذه الكعكة بأسلوبها البسيط الأنيق تجمع بين الملمسات الناعمة والتفاصيل الذهبية لنتيجة متطورة. مثالية للأشخاص ذوي الذوق الرفيع الذين يسعون للتميز في كل تفصيل.",
      },
      en: {
        title: "Modern & Chic Cake",
        description: "A clean and contemporary design for lovers of modernity. This minimalist chic cake combines smooth textures with golden accents for a sophisticated finish. Ideal for people with refined taste who seek excellence in every detail.",
      },
    },
    length: 26,
    width: 26,
    height: 13,
    pieces: 18,
    persons: 14,
    featured: false,
  },
  {
    id: "cake-10",
    slug: "gateau-creation-coloree",
    images: [
      "/images/Cake10/FB_IMG_1778413266822.jpg",
      "/images/Cake10/FB_IMG_1778413270396.jpg",
      "/images/Cake10/FB_IMG_1778413273812.jpg",
      "/images/Cake10/FB_IMG_1778413276696.jpg",
      "/images/Cake10/FB_IMG_1778413279534.jpg",
    ],
    category: "customs",
    categoryLabel: { fr: "Personnalisé", ar: "مخصص", en: "Custom" },
    translations: {
      fr: {
        title: "Création Colorée Personnalisée",
        description: "Une création sur mesure débordante de couleurs et de personnalité. Ce gâteau entièrement personnalisé reflète l'univers unique de son destinataire. Chaque couleur, chaque décoration est choisie avec soin pour créer une œuvre d'art comestible qui vous ressemble.",
      },
      ar: {
        title: "إبداع ملون مخصص",
        description: "إبداع مخصص يفيض بالألوان والشخصية. هذه الكعكة المخصصة بالكامل تعكس عالم صاحبها الفريد. كل لون وكل زينة مختارة بعناية لإنشاء عمل فني صالح للأكل يشبهك.",
      },
      en: {
        title: "Colorful Custom Creation",
        description: "A custom creation overflowing with colors and personality. This fully personalized cake reflects the unique world of its recipient. Every color and every decoration is carefully chosen to create an edible work of art that resembles you.",
      },
    },
    length: 24,
    width: 24,
    height: 12,
    pieces: 16,
    persons: 12,
    featured: true,
  },
  {
    id: "cake-11",
    slug: "gateau-diplome",
    images: [
      "/images/Cake11/FB_IMG_1778413311320.jpg",
      "/images/Cake11/FB_IMG_1778413315420.jpg",
      "/images/Cake11/FB_IMG_1778413327202.jpg",
    ],
    category: "graduation",
    categoryLabel: { fr: "Diplôme & Remise", ar: "التخرج والتكريم", en: "Graduation" },
    translations: {
      fr: {
        title: "Gâteau Remise de Diplôme",
        description: "Célébrez la réussite avec ce gâteau spécialement conçu pour les remises de diplômes. Élégamment décoré avec des symboles académiques et le prénom du lauréat, ce gâteau est le symbole parfait d'un accomplissement mémorable. Un souvenir sucré d'un moment de fierté.",
      },
      ar: {
        title: "كعكة التخرج",
        description: "احتفل بالنجاح مع هذه الكعكة المصممة خصيصاً لحفلات التخرج. مزينة بأناقة برموز أكاديمية واسم المتخرج، هذه الكعكة هي الرمز المثالي لإنجاز لا يُنسى. ذكرى حلوة للحظة فخر.",
      },
      en: {
        title: "Graduation Ceremony Cake",
        description: "Celebrate success with this cake specially designed for graduation ceremonies. Elegantly decorated with academic symbols and the graduate's name, this cake is the perfect symbol of a memorable achievement. A sweet reminder of a proud moment.",
      },
    },
    length: 26,
    width: 26,
    height: 12,
    pieces: 18,
    persons: 14,
    featured: false,
  },
  {
    id: "cake-12",
    slug: "gateau-pastel-doux",
    images: [
      "/images/Cake12/FB_IMG_1778413358469.jpg",
      "/images/Cake12/FB_IMG_1778413361638.jpg",
      "/images/Cake12/FB_IMG_1778413364883.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Pastel Douceur",
        description: "La douceur et la délicatesse à l'état pur. Ce gâteau aux tons pastel subtils est une ode à la féminité et à l'élégance. Ses décorations légères et ses couleurs apaisantes en font le choix idéal pour les anniversaires de femmes qui apprécient le raffinement.",
      },
      ar: {
        title: "كعكة الباستيل الهادئة",
        description: "الرقة والنعومة في أعلى مستوياتهما. هذه الكعكة بألوان الباستيل الهادئة هي قصيدة للأنوثة والأناقة. زيناتها الخفيفة وألوانها المريحة تجعلها الخيار الأمثل لأعياد ميلاد المرأة التي تقدر الرقي.",
      },
      en: {
        title: "Soft Pastel Cake",
        description: "Softness and delicacy in their purest form. This cake with subtle pastel tones is an ode to femininity and elegance. Its light decorations and soothing colors make it the ideal choice for women's birthdays who appreciate refinement.",
      },
    },
    length: 22,
    width: 22,
    height: 12,
    pieces: 14,
    persons: 10,
    featured: false,
  },
  {
    id: "cake-13",
    slug: "gateau-mariage-elegance",
    images: [
      "/images/Cake13/FB_IMG_1778413404351.jpg",
      "/images/Cake13/FB_IMG_1778413418882.jpg",
      "/images/Cake13/FB_IMG_1778413431122.jpg",
      "/images/Cake13/FB_IMG_1778413437675.jpg",
    ],
    category: "wedding",
    categoryLabel: { fr: "Mariage & Fiançailles", ar: "زفاف وخطوبة", en: "Wedding & Engagement" },
    translations: {
      fr: {
        title: "Gâteau de Mariage Élégance",
        description: "Un gâteau de mariage magistral qui incarne l'amour et l'élégance. Ses étages parfaitement équilibrés, ses ornements délicats et ses finitions impeccables en font la pièce centrale idéale pour votre réception de mariage. Un chef-d'œuvre sucré à la hauteur du plus beau jour de votre vie.",
      },
      ar: {
        title: "كعكة زفاف الأناقة",
        description: "كعكة زفاف رائعة تجسد الحب والأناقة. طوابقها المتوازنة تماماً وزيناتها الرقيقة وتشطيباتها المثالية تجعلها المحور الأمثل لحفلة زفافك. تحفة حلوة بمستوى أجمل يوم في حياتك.",
      },
      en: {
        title: "Wedding Elegance Cake",
        description: "A masterful wedding cake that embodies love and elegance. Its perfectly balanced tiers, delicate ornaments and impeccable finishes make it the ideal centerpiece for your wedding reception. A sweet masterpiece worthy of the most beautiful day of your life.",
      },
    },
    length: 40,
    width: 40,
    height: 30,
    pieces: 40,
    persons: 35,
    featured: true,
  },
  {
    id: "cake-14",
    slug: "gateau-chocolat-luxe",
    images: [
      "/images/Cake14/FB_IMG_1778413461900.jpg",
      "/images/Cake14/FB_IMG_1778413467683.jpg",
      "/images/Cake14/FB_IMG_1778413496990.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Chocolat Luxe",
        description: "Pour les amateurs de chocolat qui ne transigent pas sur la qualité. Ce gâteau au chocolat d'exception allie une ganache onctueuse à des décorations sophistiquées. Un équilibre parfait entre gourmandise intense et présentation haut de gamme pour une expérience inoubliable.",
      },
      ar: {
        title: "كعكة الشوكولاتة الفاخرة",
        description: "لعشاق الشوكولاتة الذين لا يتنازلون عن الجودة. هذه الكعكة الشوكولاتية الاستثنائية تجمع بين كريمة الغاناش الناعمة والزينات الراقية. توازن مثالي بين اللذة الشديدة والعرض الفاخر لتجربة لا تُنسى.",
      },
      en: {
        title: "Luxury Chocolate Cake",
        description: "For chocolate lovers who don't compromise on quality. This exceptional chocolate cake combines a smooth ganache with sophisticated decorations. A perfect balance between intense indulgence and high-end presentation for an unforgettable experience.",
      },
    },
    length: 26,
    width: 26,
    height: 14,
    pieces: 18,
    persons: 14,
    featured: false,
  },
  {
    id: "cake-15",
    slug: "gateau-simple-quotidien",
    images: [
      "/images/Cake15/FB_IMG_1778413532329.jpg",
      "/images/Cake15/FB_IMG_1778413535424.jpg",
      "/images/Cake15/FB_IMG_1778413728161.jpg",
    ],
    category: "daily",
    categoryLabel: { fr: "Gâteaux du Quotidien", ar: "كعكات يومية", en: "Everyday Cakes" },
    translations: {
      fr: {
        title: "Gâteau Simple & Délicieux",
        description: "Parfois, la simplicité est la plus belle des élégances. Ce gâteau du quotidien, avec ses décorations sobres et ses saveurs authentiques, prouve qu'un bon gâteau n'a pas besoin d'être compliqué pour être irrésistible. Idéal pour les petites célébrations du quotidien.",
      },
      ar: {
        title: "كعكة بسيطة ولذيذة",
        description: "أحياناً البساطة هي أجمل الأناقة. هذه الكعكة اليومية بزيناتها المتحفظة ونكهاتها الأصيلة تثبت أن الكعكة الجيدة لا تحتاج إلى تعقيد لتكون لا تُقاوَم. مثالية للاحتفالات الصغيرة اليومية.",
      },
      en: {
        title: "Simple & Delicious Cake",
        description: "Sometimes simplicity is the most beautiful elegance. This everyday cake, with its understated decorations and authentic flavors, proves that a good cake doesn't need to be complicated to be irresistible. Ideal for small everyday celebrations.",
      },
    },
    length: 20,
    width: 20,
    height: 10,
    pieces: 10,
    persons: 8,
    featured: false,
  },
  {
    id: "cake-16",
    slug: "gateau-personnalise-special",
    images: [
      "/images/Cake16/FB_IMG_1778413554339.jpg",
      "/images/Cake16/FB_IMG_1778413557137.jpg",
      "/images/Cake16/FB_IMG_1778413559627.jpg",
    ],
    category: "customs",
    categoryLabel: { fr: "Personnalisé", ar: "مخصص", en: "Custom" },
    translations: {
      fr: {
        title: "Création Personnalisée Spéciale",
        description: "Une création entièrement sur mesure pour marquer un événement exceptionnel. Ce gâteau personnalisé reflète vos souhaits les plus précis, du thème aux couleurs en passant par les décorations. Partagez votre vision et nous la réalisons avec passion et professionnalisme.",
      },
      ar: {
        title: "إبداع مخصص خاص",
        description: "إبداع مخصص بالكامل لتخليد حدث استثنائي. هذه الكعكة المخصصة تعكس رغباتك الأكثر دقة، من الثيمة إلى الألوان ومروراً بالزينات. شارك رؤيتك ونحن ننفذها بشغف واحترافية.",
      },
      en: {
        title: "Special Custom Creation",
        description: "A fully custom creation to mark an exceptional event. This personalized cake reflects your most precise wishes, from the theme to the colors and decorations. Share your vision and we'll bring it to life with passion and professionalism.",
      },
    },
    length: 24,
    width: 24,
    height: 14,
    pieces: 16,
    persons: 12,
    featured: false,
  },
  {
    id: "cake-17",
    slug: "gateau-artistique",
    images: [
      "/images/Cake17/FB_IMG_1778413581359.jpg",
      "/images/Cake17/FB_IMG_1778413584782.jpg",
      "/images/Cake17/FB_IMG_1778413587514.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Artistique",
        description: "L'art au service de la pâtisserie. Ce gâteau artistique repousse les limites du possible pour offrir une véritable œuvre comestible. Chaque détail est exécuté avec une précision et un soin exceptionnels, faisant de ce gâteau une expérience visuelle avant même d'être gustative.",
      },
      ar: {
        title: "الكعكة الفنية",
        description: "الفن في خدمة الحلويات. هذه الكعكة الفنية تتجاوز حدود الممكن لتقديم عمل فني أكيل حقيقي. كل تفصيل ينفذ بدقة واهتمام استثنائيين، مما يجعل هذه الكعكة تجربة بصرية قبل أن تكون تجربة ذوقية.",
      },
      en: {
        title: "Artistic Cake",
        description: "Art in the service of patisserie. This artistic cake pushes the boundaries of the possible to offer a true edible masterpiece. Every detail is executed with exceptional precision and care, making this cake a visual experience before it's even a taste one.",
      },
    },
    length: 28,
    width: 28,
    height: 16,
    pieces: 20,
    persons: 16,
    featured: false,
  },
  {
    id: "cake-18",
    slug: "gateau-romantique-fleurs",
    images: [
      "/images/Cake18/FB_IMG_1778413600688.jpg",
      "/images/Cake18/FB_IMG_1778413603962.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Femmes", ar: "عيد ميلاد النساء", en: "Women's Birthday" },
    translations: {
      fr: {
        title: "Gâteau Romantique aux Fleurs",
        description: "Un gâteau romantique et délicat sublimé par des fleurs fraîches et des décorations féminines. Ce chef-d'œuvre fleuri est parfait pour célébrer les femmes qui méritent ce qu'il y a de plus beau. Élégant, raffiné, et absolument irrésistible.",
      },
      ar: {
        title: "كعكة رومانسية بالورود",
        description: "كعكة رومانسية ورقيقة تتجمل بالزهور الطازجة والزينات الأنثوية. هذه التحفة المزهرة مثالية للاحتفال بالنساء اللواتي يستحقن أجمل ما في الوجود. أنيقة، راقية، ولا تُقاوَم تماماً.",
      },
      en: {
        title: "Romantic Flower Cake",
        description: "A romantic and delicate cake enhanced by fresh flowers and feminine decorations. This floral masterpiece is perfect for celebrating women who deserve the most beautiful things. Elegant, refined, and absolutely irresistible.",
      },
    },
    length: 22,
    width: 22,
    height: 12,
    pieces: 14,
    persons: 10,
    featured: false,
  },
  {
    id: "cake-19",
    slug: "gateau-celebration",
    images: [
      "/images/Cake19/FB_IMG_1778413672901.jpg",
      "/images/Cake19/FB_IMG_1778413678229.jpg",
      "/images/Cake19/FB_IMG_1778413700706.jpg",
      "/images/Cake19/FB_IMG_1778413705390.jpg",
      "/images/Cake19/FB_IMG_1778413709284.jpg",
    ],
    category: "birthday-adults",
    categoryLabel: { fr: "Anniversaire Adultes", ar: "عيد ميلاد البالغين", en: "Adult Birthday" },
    translations: {
      fr: {
        title: "Gâteau Grande Célébration",
        description: "Pour les grandes occasions qui méritent un grand gâteau. Cette création imposante et majestueuse est conçue pour impressionner et ravir tous vos invités. Avec ses décorations élaborées et sa présentation spectaculaire, ce gâteau transforme chaque célébration en moment magique.",
      },
      ar: {
        title: "كعكة الاحتفال الكبير",
        description: "للمناسبات الكبرى التي تستحق كعكة كبيرة. هذا الإبداع المهيب والجليل مصمم لإبهار جميع ضيوفك وإسعادهم. بزيناته المتطورة وعرضه المذهل، يحول هذا الكعكة كل احتفال إلى لحظة سحرية.",
      },
      en: {
        title: "Grand Celebration Cake",
        description: "For great occasions that deserve a great cake. This imposing and majestic creation is designed to impress and delight all your guests. With its elaborate decorations and spectacular presentation, this cake transforms every celebration into a magical moment.",
      },
    },
    length: 32,
    width: 32,
    height: 18,
    pieces: 25,
    persons: 20,
    featured: true,
  },
];

export function getCakeBySlug(slug: string): Cake | undefined {
  return CAKES.find((c) => c.slug === slug);
}

export function getCakesByCategory(category: string): Cake[] {
  if (!category || category === "all") return CAKES;
  return CAKES.filter((c) => c.category === category);
}

export function getFeaturedCakes(): Cake[] {
  return CAKES.filter((c) => c.featured);
}

export function getSimilarCakes(cake: Cake, count = 3): Cake[] {
  return CAKES.filter((c) => c.id !== cake.id && c.category === cake.category).slice(0, count);
}
