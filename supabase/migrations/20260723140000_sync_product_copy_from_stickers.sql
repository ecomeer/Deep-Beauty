create schema if not exists internal_backups;

create table if not exists internal_backups.products_before_sticker_copy_20260723 as
select *
from public.products
where slug in (
  'aker-fassi-brightening-scrub',
  'aker-fassi-brightening-soap',
  'aker-fassi-brightening-spray',
  'herbal-body-dalka',
  'herbal-dalka-oil',
  'vitamin-c-turmeric-scrub',
  'vitamin-c-turmeric-cream',
  'vitamin-c-turmeric-soap',
  'silk-body-cream',
  'silk-shower-gel',
  'silk-khumria',
  'coffee-scrub',
  'bridal-oil',
  'natural-sidr-shampoo'
);

with sticker_copy(slug, description_ar, ingredients_ar, usage_ar) as (
  values
    (
      'aker-fassi-brightening-scrub',
      $copy$سنفرة غنية بحبيبات السكر الطبيعية وزبدة الشيا والزيوت المغذية، تساعد على تقشير البشرة بلطف وإزالة الخلايا الميتة لتترك البشرة أكثر نعومة وإشراقًا. تحتوي على بودرة العكر الفاسي ومزيج من المكونات المرطبة.$copy$,
      $copy$Sucrose, Glycerin, Cera Alba (Beeswax), Butyrospermum Parkii (Shea) Butter, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Helianthus Annuus (Sunflower) Seed Oil, Aker Fassi Powder, Emulsifying Wax, Preservative, Fragrance.$copy$,
      $copy$تُوضع كمية مناسبة على بشرة مبللة، ثم تُدلك بلطف بحركات دائرية مع التركيز على المناطق الخشنة والجافة، ثم تُشطف بالماء جيداً.$copy$
    ),
    (
      'aker-fassi-brightening-soap',
      $copy$دلّلي بشرتك بصابونية العكر الفاسي الغنية بالزيوت الطبيعية المغذية، والممزوجة ببودرة العكر الفاسي المعروفة باستخدامها التقليدي في العناية بالبشرة وإضفاء مظهر أكثر إشراقًا وحيوية.$copy$,
      $copy$Cocos Nucifera Oil, Helianthus Annuus Seed Oil, Aqua, Sodium Hydroxide, Avena Sativa Extract, Aker Fassi Powder, Fragrance.$copy$,
      $copy$يُبلل الجسم بالماء الدافئ، ثم تُؤخذ كمية مناسبة من الصابونية وتُوزع على البشرة مع التدليك بحركات دائرية لمدة 3–5 دقائق، تُترك لمدة قصيرة حسب الحاجة، ثم تُشطف بالماء جيداً.$copy$
    ),
    (
      'aker-fassi-brightening-spray',
      $copy$تركيبة مستوحاة من أسرار الجمال المغربي، غنية بالعكر الفاسي لتمنح البشرة مظهرًا أكثر إشراقًا وحيوية مع لمسة وردية طبيعية. ينساب برذاذ خفيف ومتجانس على البشرة ليضفي عليها لونًا موردًا.$copy$,
      $copy$Aqua, Glycerin, Polysorbate, Aker Fassi Extract, Tocopheryl Acetate (Vitamin E), Preservative, Parfum.$copy$,
      $copy$يُرش على بشرة نظيفة وجافة من مسافة مناسبة، ثم يُترك حتى يتم امتصاصه بالكامل. يمكن استخدامه يومياً حسب الحاجة.$copy$
    ),
    (
      'herbal-body-dalka',
      $copy$توليفة من الأعشاب المفتحة الغنية بالفيتامينات والأحماض الطبيعية، ممزوجة بزيوت العناية بالجسم. تساعد على إزالة الخلايا الميتة من البشرة وتمنحها مظهرًا أنعم وأكثر توحيدًا وإشراقًا.$copy$,
      $copy$Herbs, Oils, Beeswax, Shea Butter, Preservative.$copy$,
      $copy$يُبلل الجسم بالماء الدافئ، ثم تُؤخذ كمية مناسبة من الدلكة وتُوزع على البشرة مع التدليك بحركات دائرية. تُترك لمدة 3–5 دقائق حسب الحاجة، ثم تُشطف بالماء جيداً.$copy$
    ),
    (
      'herbal-dalka-oil',
      $copy$زيت فاخر مخصص لجلسات الدلكة والعناية بالجسم، يمنح البشرة ترطيبًا عميقًا وملمسًا حريريًا ناعمًا بعد الاستخدام. يساعد على تحسين مرونة الجلد وتسهيل عملية التدليك، ويترك البشرة بإحساس ناعم ومريح.$copy$,
      $copy$Sweet Almond Oil, Grape Seed Oil, Polysorbate, Vitamin E, Essential Oil.$copy$,
      $copy$بعد استخدام الدلكة وقبل أن تجف تماماً على الجسم، تُوضع كمية مناسبة من زيت الدلكة، ثم تُفرك البشرة بحركات دائرية، وبعدها يُغسل الجسم بالماء جيداً.$copy$
    ),
    (
      'vitamin-c-turmeric-scrub',
      $copy$سنفرة طبيعية تساعد على إزالة الخلايا الميتة بلطف وتمنح البشرة نعومة وإشراقة واضحة. تجمع بين تقشير السكر وإنعاش زيت الليمون وتهدئة الشوفان، مع الكركم المعروف بخصائصه الموحّدة للون البشرة.$copy$,
      $copy$Sucrose, Citrus Limon Peel Oil, Curcuma Longa Root Extract, Avena Sativa Kernel Extract, Emulsifying Wax, Beeswax, Vegetable Oil.$copy$,
      $copy$تُوضع كمية مناسبة على بشرة مبللة، ثم تُدلك بلطف بحركات دائرية مع التركيز على المناطق الخشنة والجافة، ثم تُشطف بالماء جيداً.$copy$
    ),
    (
      'vitamin-c-turmeric-cream',
      $copy$كريم خفيف وغني مصمم ليمنح البشرة إشراقة واضحة ولمسة ناعمة من أول استخدام. يجمع بين قوة فيتامين C وزيت الليمون المعروف بخصائصه المنعشة والمضيئة للبشرة، مع ترطيب عميق يدوم طوال اليوم.$copy$,
      $copy$Aqua, Sweet Almond Oil, Emulsifying Wax, Stearic Acid, Shea Butter, Glycerin, Citrus Limon Peel Oil, Parfum, Ascorbic Acid, Preservative.$copy$,
      $copy$يُوزع على بشرة نظيفة وجافة مع التدليك بلطف حتى الامتصاص الكامل. يُستخدم يومياً للمساعدة في ترطيب البشرة وتحسين مظهرها ومنحها نعومة وإشراقة طبيعية.$copy$
    ),
    (
      'vitamin-c-turmeric-soap',
      $copy$صابونية تفتيح وتوحيد لون البشرة، مصممة لتنظيف لطيف مع دعم إشراقة الجلد وتقليل مظهر البهتان. تحتوي على مضادات أكسدة طبيعية من الليمون والكركم، مع زيوت مغذية تساعد على ترطيب البشرة.$copy$,
      $copy$Cocos Nucifera Oil, Helianthus Annuus Seed Oil, Aqua, Sodium Hydroxide, Citrus Limon Fruit Extract, Curcuma Longa Root Extract, Parfum.$copy$,
      $copy$يُبلل الجسم بالماء الدافئ، ثم تُؤخذ كمية مناسبة من الصابونية وتُوزع على البشرة مع التدليك بحركات دائرية لمدة 3–5 دقائق، تُترك لمدة قصيرة حسب الحاجة، ثم تُشطف بالماء جيداً.$copy$
    ),
    (
      'silk-body-cream',
      $copy$كريم جسم غني بتركيبة مرطبة عميقة تساعد على تنعيم البشرة ومنحها ترطيبًا يدوم طوال اليوم. يتميز بقوام كريمي خفيف يمتص بسرعة دون أن يترك ملمسًا دهنيًا، ليمنحك إحساسًا بالنعومة والراحة.$copy$,
      $copy$Aqua, Glycerin, Emulsifying Wax, Cetearyl Alcohol, Butyrospermum Parkii Butter, Prunus Amygdalus Dulcis Oil, Helianthus Annuus Seed Oil, Caprylic/Capric Triglyceride, Tocopherol, Panthenol, Parfum, Phenoxyethanol, Ethylhexylglycerin, Citric Acid.$copy$,
      $copy$يُوزع على بشرة نظيفة وجافة مع التدليك بلطف حتى الامتصاص الكامل. يُستخدم يومياً للمساعدة في ترطيب البشرة ومنحها ملمساً ناعماً وحريرياً.$copy$
    ),
    (
      'silk-shower-gel',
      $copy$جل استحمام لطيف على البشرة بتركيبة طبيعية تنظف بعمق دون أن تسبب جفافًا. يمنح رغوة ناعمة وتنظيفًا فعّالًا مع الحفاظ على ترطيب البشرة ونعومتها، مع رائحة منعشة تدوم بعد الاستحمام.$copy$,
      $copy$Aqua, Cocamidopropyl Betaine, Decyl Glucoside, Glycerin, Aloe Barbadensis Leaf Juice, Helianthus Annuus Seed Oil, Prunus Amygdalus Dulcis Oil, Sodium Chloride, Parfum, Tocopherol, Citric Acid, Preservative.$copy$,
      $copy$يُوضع على بشرة مبللة أثناء الاستحمام، ثم يُدلك بلطف حتى تتكون رغوة ناعمة، وبعدها يُشطف الجسم بالماء جيداً.$copy$
    ),
    (
      'silk-khumria',
      $copy$خمرية فاخرة بتركيبة حريرية غنية بالمكونات الطبيعية المغذية، تمنح الجسم عطرًا فريدًا يدوم طويلًا مع ملمس ناعم وحريري للبشرة. تُستخدم بعد الاستحمام لتعزيز نعومة البشرة وإضفاء رائحة أنثوية مميزة.$copy$,
      $copy$Natural Oils Blend, Nourishing Oils, Moisturizing Oils.$copy$,
      $copy$تُستخدم بعد الاستحمام على بشرة نظيفة وجافة. تُؤخذ كمية مناسبة وتُوزع على مناطق النبض أو الجسم مع التدليك بلطف لتعطير البشرة ومنحها ملمساً ناعماً.$copy$
    ),
    (
      'coffee-scrub',
      $copy$سنفرة غنية بالقهوة واللبان واللافندر، مع مزيج من الزبدات الأفريقية وفيتامين E. تساعد على تنعيم البشرة وتحسين مظهرها ومنحها إحساسًا بالانتعاش والمرونة بعد الاستخدام.$copy$,
      $copy$Sucrose, Emulsifying Wax, Beeswax, Butyrospermum Parkii Butter, Lavandula Angustifolia Oil, Coffea Arabica Seed Extract, Boswellia Serrata Extract, Helianthus Annuus Seed Oil, Prunus Amygdalus Dulcis Oil, Parfum, Preservative.$copy$,
      $copy$تُوضع كمية مناسبة على بشرة مبللة، ثم تُدلك بلطف بحركات دائرية مع التركيز على المناطق الخشنة والجافة، ثم تُشطف بالماء جيداً.$copy$
    ),
    (
      'bridal-oil',
      $copy$زيت فاخر للعناية بالجسم، مصمم خصيصًا للعروس ليمنح البشرة نعومة فائقة وإشراقة طبيعية. يغذي البشرة بعمق ويتركها بملمس حريري ورائحة أنثوية ساحرة تدوم طويلًا.$copy$,
      $copy$Natural Oils Blend, Nourishing Oils, Moisturizing Oils.$copy$,
      $copy$بعد الاستحمام، يُوضع على جسم مبلل أو رطب، ثم يُدلك بلطف على كامل الجسم حتى يتم امتصاصه.$copy$
    ),
    (
      'natural-sidr-shampoo',
      $copy$شامبو السدر الطبيعي الخالي من السلفات، بتركيبة غنية بمستخلص أوراق السدر التي تساعد على تقوية بصيلات الشعر وتغذية كثافته، مع تنظيف لطيف يحافظ على التوازن الطبيعي لفروة الرأس. يحتوي على فيتامين B5 (بانثينول) المعروف بخصائصه المرطبة والمقوية للشعر. خالٍ من السلفات، البارابين، السيليكون، والمواد الكيميائية الضارة. طبيعي وآمن لجميع أنواع الشعر.$copy$,
      $copy$Sodium Cocoyl Isethionate, Distilled Water, Sidr Powder, Glycerin, Betaine, Panthenol (Vitamin B5), Citric Acid, Preservative, Essential Oil.$copy$,
      $copy$تُرج العلبة قبل الاستعمال. يُبلل الشعر جيداً، ثم تُوضع كمية مناسبة من الشامبو على فروة الرأس، وتُدلك بلطف بحركات دائرية، ثم يُشطف الشعر بالماء الفاتر.$copy$
    )
)
update public.products as products
set
  description_ar = sticker_copy.description_ar,
  ingredients_ar = sticker_copy.ingredients_ar,
  usage_ar = sticker_copy.usage_ar,
  benefits_ar = null,
  updated_at = now()
from sticker_copy
where products.slug = sticker_copy.slug;
