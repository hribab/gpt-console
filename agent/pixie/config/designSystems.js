const designSystems = {
    "blk": {
        "description": "BLK Design System boasts a moody, dark theme that infuses modern flair and a high-tech ambiance. It's a perfect fit for innovative tech companies, crypto platforms, or digital portfolios targeting a youthful and tech-savvy audience."
    },
    "paperui": {
        "description": "Paper Kit 2 PRO provides a minimalist, light-themed design that emphasizes clarity and simplicity. It's well-suited for educational platforms, non-profits, and startups looking for an accessible and friendly user experience."
    },
    "material": {
        "description": "Material Kit PRO adheres to Google's Material Design principles, offering a design that adds depth and dimension through shadows and gradients. Excellent for apps and websites that require a sleek, functional design, such as productivity tools and eCommerce platforms."
    },
    "nowui": {
        "description": "Now UI Kit PRO offers a burst of color and a clean, modern aesthetic. Ideal for brands wanting to convey energy and innovation, such as marketing agencies, lifestyle blogs, or e-commerce platforms with a vibrant brand persona."
    },
    "documentation": {
        "description": "Only for documentation purpose"
    }    

}



const skeletonAndConfigURL = {
    "blk": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fblk%2Fyourproject.zip?alt=media&token=cd9e1f51-8e88-4b74-97df-09c794df5428",//https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fblk%2Fyourproject.zip?alt=media&token=acef91b0-a998-4513-887a-723e02a3b9cf",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fblk%2Fblkconfig.json?alt=media&token=3defd0de-d705-41e3-9745-e7fda23be55c"
    },
    "paperui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fpaper%2Fyourproject.zip?alt=media&token=2c674766-ef3d-417a-854a-9c879a0c3440",//"https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fpaper%2Fyourproject.zip?alt=media&token=cdfa8dc6-f7aa-4373-8cf5-74467f68b47d",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fpaper%2Fpaperuiconfig.json?alt=media&token=541deda0-521d-4480-90ef-d0fdd65696aa"
    },
    "material": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fmaterial%2Fyourproject.zip?alt=media&token=5a486520-64bd-4099-bd0b-2f4cb116901c",//"https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fmaterial%2Fyourproject.zip?alt=media&token=ced68999-c560-4bcf-b4dd-38b1bc389880",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fmaterial%2Fmaterialkitconfig.json?alt=media&token=e38c787b-52d0-4986-b680-2aad96deac05"
    },
    "nowui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fnowui%2Fyourproject.zip?alt=media&token=3fcaa32e-e2cb-45c0-94d6-154e637e7fe6",//"https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fnowui%2Fyourproject.zip?alt=media&token=c60cdbc2-31ce-4ced-b31a-09565bd7d8ce",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fnowui%2Fnowui.json?alt=media&token=0c2afe20-3181-4de7-a01c-de930ef71891"
    },
};

const themeNames = {
    "blk": "ObsidianCrux",
    "paperui": "ParchmentOrigami",
    "material": "ElementMosaic",
    "nowui": "InstantSpectrum"
  };

module.exports = {
    designSystems,
    skeletonAndConfigURL,
    themeNames
}