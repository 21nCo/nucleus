Implement SIDE NAV combination with the below requirements
Side nav combination is nothing but something similar to docusaurus docs, Gitbook, Mintlify etc... where on the left a side nav will be present with deep nestability and sections and upon click of the document - opens the doc in middle section and shows TOC on the right...

The difference is... here the combination side nav can contain not just markdown node but also any other node, collection or another combination

For node - see Node.svelte and related files

For collection - see Collection.svelte and related files

So, when CreateCombination.svelte is used to create a sidenav combination - it should create a new side nav combination with title on the top of the side nav and ability to add, edit, rearrange, nest, sectionize etc elements on the side nav - in side nav the title/label of the resources added will be shown along with avatar if avatar is present

Each side nav element can be below data

label/title, avatar, number of children (on right side) - upon click - renders that resource in the mid section - upon click of chevron if (nested children is present) opens the nesting

Use combination.store for CRUD operations and refer other similar collection.store, node.store for reference

Follow codebase's styling and other best practices
