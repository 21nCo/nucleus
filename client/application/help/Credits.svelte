<script lang="ts">
  import CreditSection from "@nucleum/application/help/CreditSection.svelte";

  interface CreditItem {
    name: string;
    description: string;
    creator: string;
    link: string;
  }

  const libraries: CreditItem[] = [
    {
      name: "G6 graph library",
      description: "Graph visualization engine by Ant",
      creator: "AntV",
      link: "https://g6.antv.vision/en"
    },
    {
      name: "PDF.js",
      description: "PDF viewer built with web standards",
      creator: "Mozilla",
      link: "https://mozilla.github.io/pdf.js/"
    },
    {
      name: "Hugging Face",
      description: "Open-source machine learning platform",
      creator: "Hugging Face",
      link: "https://huggingface.co/"
    },
    {
      name: "Iconify",
      description: "Icon framework with thousands of icons",
      creator: "Vjacheslav Trushkin",
      link: "https://iconify.design/"
    },
    {
      name: "Storybook",
      description: "UI component development environment",
      creator: "Storybook Team",
      link: "https://storybook.js.org/"
    },
    {
      name: "Tauri",
      description: "Build smaller, faster, more secure desktop apps",
      creator: "Tauri Programme",
      link: "https://tauri.app/"
    },
    {
      name: "Plasmo",
      description: "Browser extension framework",
      creator: "Plasmo Corp",
      link: "https://www.plasmo.com/"
    },
    {
      name: "Monaco Editor",
      description: "The VS Code editor is available as a component",
      creator: "Microsoft",
      link: "https://microsoft.github.io/monaco-editor/"
    },
    {
      name: "D3.js",
      description: "JavaScript library for data visualizations",
      creator: "Mike Bostock",
      link: "https://d3js.org/"
    },
    {
      name: "Wavesurfer.js",
      description: "Audio visualization library",
      creator: "katspaugh",
      link: "https://wavesurfer-js.org/"
    },
    {
      name: "Apache ECharts",
      description: "Powerful charting and visualization library",
      creator: "Apache Software Foundation",
      link: "https://echarts.apache.org/"
    }
  ];

  const frameworks: CreditItem[] = [
    {
      name: "Svelte",
      description: "Cybernetically enhanced web apps",
      creator: "Rich Harris",
      link: "https://svelte.dev/"
    },
    {
      name: "Vite",
      description: "Next generation frontend tooling",
      creator: "Evan You",
      link: "https://vitejs.dev/"
    },
    {
      name: "Tailwind",
      description: "Utility-first CSS framework",
      creator: "Tailwind Labs",
      link: "https://tailwindcss.com/"
    },
    {
      name: "Node.js",
      description: "JavaScript runtime environment",
      creator: "Ryan Dahl",
      link: "https://nodejs.org/"
    },
    {
      name: "VS Code",
      description: "The status-quo code editor",
      creator: "Microsoft",
      link: "https://code.visualstudio.com/"
    },
    {
      name: "MySQL",
      description: "Open-source relational database management system",
      creator: "Oracle Corporation",
      link: "https://www.mysql.com/"
    },
    {
      name: "Better Auth",
      description: "Framework-agnostic authentication library",
      creator: "Better Auth Team",
      link: "https://www.better-auth.com/"
    }
  ];

  const design: CreditItem[] = [
    {
      name: "Phosphor Icons",
      description: "Flexible icon family for interfaces",
      creator: "Helena Zhang & Tobias Fried",
      link: "https://phosphoricons.com/"
    },
    {
      name: "Hero icons",
      description: "Beautiful hand-crafted SVG icons",
      creator: "Tailwind CSS",
      link: "https://heroicons.com/"
    },
    {
      name: "Solar Icons (Unmodified)",
      description:
        "Solar is a large icon library consisting of pictograms that are modern in style",
      creator: "480 Design (CC 4.0)",
      link: "https://github.com/480-Design/Solar-Icon-Set"
    },
    {
      name: "Svg spinners",
      description: "Extremely useful set of SVG spinners",
      creator: "Utkarsh Verma",
      link: "https://github.com/n3r4zzurr0/svg-spinners"
    },
    {
      name: "MynaUI Icons",
      description: "A collection of well-crafted icons from MynaUI",
      creator: "MynaUI",
      link: "https://mynaui.com/icons"
    },
    {
      name: "Material symbols",
      description: "An extensive collection of icons",
      creator: "Google - material design",
      link: "https://fonts.google.com/icons"
    },
    {
      name: "IllustrationKit",
      description: "Premium handcrafted illustrations",
      creator: "Khushmeen Sidhu",
      link: "https://illustrationkit.com/"
    }
  ];

  const fonts: CreditItem[] = [
    {
      name: "AR One Sans",
      description:
        "AR One Sans is a type family for use in augmented reality environments and user interfaces.",
      creator: "Niteesh Yadav",
      link: "https://github.com/niteeshy/ar-one-sans"
    },
    {
      name: "Comic Neue",
      description:
        "Comic Neue is a casual script typeface that is a more modern and refined version of Comic Sans.",
      creator: "Craig Rozynski",
      link: "https://fonts.google.com/specimen/Comic+Neue"
    },
    {
      name: "Didact Gothic",
      description:
        "Didact Gothic is a sans-serif font designed to present each letter in the form most often used in elementary classrooms.",
      creator: "Daniel Johnson",
      link: "https://fonts.google.com/specimen/Didact+Gothic"
    },
    {
      name: "DM Sans",
      description:
        "DM Sans is a low-contrast geometric sans serif designed for better reading at small sizes.",
      creator: "Colophon Foundry",
      link: "https://fonts.google.com/specimen/DM+Sans"
    },
    {
      name: "Figtree",
      description:
        "Figtree is a friendly humanist sans serif with a playful character.",
      creator: "Erik Kennedy",
      link: "https://github.com/erikdkennedy/figtree"
    },
    {
      name: "Fredoka",
      description:
        "Fredoka One is a big, round, bold font that is perfect for adding a little fun to any headline or large text.",
      creator: "Ben Nathan",
      link: "https://github.com/hafontia-zz/Fredoka-One"
    },
    {
      name: "Funnel Sans",
      description:
        "Funnel Sans is a rounded sans-serif typeface designed for better legibility.",
      creator: "NDISCOVER",
      link: "https://fonts.google.com/specimen/Funnel+Sans"
    },
    {
      name: "Geist",
      description:
        "Geist is a new font family created specifically for developers and designers.",
      creator: "Vercel",
      link: "https://vercel.com/font"
    },
    {
      name: "Hanken Grotesk",
      description:
        "A clean geometric sans serif typeface inspired by the classic grotesques.",
      creator: "Alfredo Marco Pradil",
      link: "https://github.com/marcologous/hanken-grotesk"
    },
    {
      name: "Host Grotesk",
      description:
        "Host Grotesk is a contemporary take on classic grotesque typefaces.",
      creator: "Future Fonts",
      link: "https://www.futurefonts.xyz/atlas-font-foundry/host-grotesk"
    },
    {
      name: "IBM Plex Sans",
      description:
        "IBM Plex Sans is a humanist sans serif typeface designed by Mike Abbink.",
      creator: "IBM",
      link: "https://github.com/IBM/plex"
    },
    {
      name: "Inter",
      description:
        "Inter is a typeface carefully crafted and designed for computer screens.",
      creator: "Rasmus Andersson",
      link: "https://rsms.me/inter/"
    },
    {
      name: "Lexend",
      description:
        "Lexend fonts are intended to reduce visual stress and so improve reading performance.",
      creator: "Bonnie Shaver-Troup",
      link: "https://github.com/googlefonts/lexend"
    },
    {
      name: "Manrope",
      description:
        "Manrope is an open-source modern sans-serif font family, designed by Mikhail Sharanda.",
      creator: "Mikhail Sharanda",
      link: "https://github.com/sharanda/manrope"
    },
    {
      name: "Maven Pro",
      description:
        "Maven Pro is a sans-serif typeface with unique curvature and flowing rhythm.",
      creator: "Joe Prince",
      link: "https://github.com/googlefonts/mavenproFont"
    },
    {
      name: "Montserrat",
      description:
        "The old posters and signs in the traditional Montserrat neighborhood of Buenos Aires inspired Julieta Ulanovsky to design this typeface.",
      creator: "Julieta Ulanovsky",
      link: "https://github.com/JulietaUla/Montserrat"
    },
    {
      name: "Noto Sans",
      description:
        "Noto Sans is a family of fonts designed to support all languages and scripts.",
      creator: "Google",
      link: "https://github.com/googlefonts/noto-fonts"
    },
    {
      name: "Nunito",
      description: "Nunito is a well balanced sans serif typeface superfamily.",
      creator: "Vernon Adams",
      link: "https://github.com/googlefonts/nunito"
    },
    {
      name: "Onest",
      description:
        "Onest is a geometric sans-serif typeface with a modern and clean appearance.",
      creator: "Andrey Kudryavtsev",
      link: "https://github.com/EvgeniyKudryavtsev/onest-font"
    },
    {
      name: "Outfit",
      description: "A geometric sans-serif typeface",
      creator: "Outfit.io",
      link: "https://github.com/Outfitio/Outfit-Fonts"
    },
    {
      name: "Oxygen",
      description: "A humanist sans-serif typeface",
      creator: "Vernon Adams",
      link: "https://fonts.google.com/specimen/Oxygen"
    },
    {
      name: "Parkinsans",
      description:
        "A Poppins fork which is energetic, human, accessible, approachable",
      creator: "Red Stone",
      link: "https://github.com/redstonedesign/parkinsans"
    },
    {
      name: "Plus Jakarta Sans",
      description:
        "Plus Jakarta Sans is a sans-serif typeface that is geometric yet friendly.",
      creator: "Gumpita Rahayu",
      link: "https://fonts.google.com/specimen/Plus+Jakarta+Sans"
    },
    {
      name: "Poppins",
      description: "A geometric sans-serif typeface",
      creator: "Indian Type Foundry",
      link: "https://github.com/itfoundry/poppins"
    },
    {
      name: "Quicksand",
      description:
        "Quicksand is a display sans serif with rounded terminals but legible enough to use in small sizes as well",
      creator: "Andrew Paglinawan",
      link: "https://github.com/andrew-paglinawan/QuicksandFamily"
    },
    {
      name: "Questrial",
      description:
        "A geometric sans-serif typeface influenced by Swiss design, similar to a grotesk style which is closely found in Helvetica.",
      creator: "Joe Prince",
      link: "https://github.com/googlefonts/questrial"
    },
    {
      name: "Recursive",
      description:
        "Recursive is typographic palette for UI & code which draws inspiration from single-stroke casual.",
      creator: "Arrow Type",
      link: "https://www.recursive.design"
    },
    {
      name: "Red Hat Text",
      description:
        "Red Hat is a fresh take on the geometric sans genre, taking inspiration from a range of American sans serifs including Tempo and Highway Gothic.",
      creator: "Red Hat",
      link: "https://github.com/RedHatOfficial/RedHatFont"
    },
    {
      name: "Rubik",
      description:
        "Rubik is a sans serif font family with slightly rounded corners designed by Philipp Hubert and Sebastian Fischer.",
      creator: "Philipp Hubert & Sebastian Fischer",
      link: "https://fonts.google.com/specimen/Rubik"
    },
    {
      name: "Sen",
      description:
        "Sen is a geometrically constructed sans-serif with a sensible, friendly look.",
      creator: "Kosal Sen & Philatype",
      link: "https://github.com/philatype/Sen"
    },
    {
      name: "Sora",
      description:
        "Sora, meaning sky in Japanese, is a typeface family commissioned for the Sora decentralized autonomous economy.",
      creator: "Jonathan Barnbrook",
      link: "https://github.com/sora-xor/sora-font"
    },
    {
      name: "Space Grotesk",
      description:
        "Space Grotesk is a proportional sans-serif typeface variant based on Colophon Foundry's fixed-width Space Mono family (2016).",
      creator: "Florian Karsten",
      link: "https://github.com/floriankarsten/space-grotesk"
    },
    {
      name: "Teachers",
      description:
        "The Teachers font is an educational font family created for use by publishers, teachers, students, and parents of children in grades K through 6.",
      creator: "Chank Diesel",
      link: "https://github.com/chankfonts/Teachers-fonts"
    },
    {
      name: "Varela",
      description:
        "Varela is a modern sans-serif font that blends styles of many great typefaces.",
      creator: "Joe Prince",
      link: "https://fonts.google.com/specimen/Varela"
    },
    {
      name: "Varela Round",
      description:
        "Varela Round is a rounded version of Varela, providing a more friendly and approachable feel.",
      creator: "Joe Prince",
      link: "https://fonts.google.com/specimen/Varela+Round"
    }
  ];
</script>

<div class="flex flex-col gap-6 w-full h-full p-6 overflow-auto">
  <div class="flex flex-col gap-8">
    <div class="flex justify-center mt-4">
      <div class="text-fgs3 text-b3 text-center">
        Thanks to all of these amazing ❤️ open source projects that made this
        application possible.
      </div>
    </div>
    <CreditSection title="Design" items={design} />
    <CreditSection title="Fonts" items={fonts} />
    <CreditSection title="Libraries" items={libraries} />
    <CreditSection title="Frameworks & Tools" items={frameworks} />
  </div>
</div>
