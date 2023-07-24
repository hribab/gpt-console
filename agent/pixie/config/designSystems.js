const designSystems = {
    "blk": {
        "description": "The BLK Design System, with its dark theme and sleek, modern aesthetic, lends an air of sophistication and innovation. Particularly suitable for tech-focused or cutting-edge businesses, this system might appeal to a younger, tech-savvy demographic. It's an excellent choice for projects such as cryptocurrency platforms, digital agency portfolios, music or entertainment websites, or any application that aims for a strong visual impact."
    },
    "paperui": {
        "description": "The Paper Kit 2 PRO offers a light, clean, and flat aesthetic. This kit could give your project a clear, uncluttered look and feel, which makes it ideal for educational platforms, non-profits, startups, small businesses, or personal portfolios. It might be particularly effective if you're aiming for an easy-to-understand, friendly, or approachable vibe."
    },
    "material": {
        "description": "The Material Kit PRO, based on Google's Material Design, combines a clean look with a depth of design. Its use of shadows, gradients, and complex structures gives a 3D feel to your project. Ideal for productivity apps, project management tools, eCommerce, and social networking sites, this theme might be particularly effective for tech companies, or any business requiring a modern, user-friendly interface."
    },   
    "nowui": {
        "description": "The Now UI Kit PRO brings a refreshingly clean and vibrant look to your project. Its use of bold colors, beautiful typography, and clear user interface components creates a visually pleasing experience. This could be an excellent choice for marketing or advertising agencies, lifestyle blogs, e-commerce platforms with a fun and vibrant aesthetic, or even travel and tourism websites. It might be particularly effective for any businesses aiming to project a contemporary, innovative brand image."
    }
}



const skeletonAndConfigURL = {
    "blk": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fblk%2Fyourproject.zip?alt=media&token=acef91b0-a998-4513-887a-723e02a3b9cf",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fblk%2Fblkconfig.json?alt=media&token=3defd0de-d705-41e3-9745-e7fda23be55c"
    },
    "paperui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fpaper%2Fyourproject.zip?alt=media&token=cdfa8dc6-f7aa-4373-8cf5-74467f68b47d",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fpaper%2Fpaperuiconfig.json?alt=media&token=541deda0-521d-4480-90ef-d0fdd65696aa"
    },
    "material": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fmaterial%2Fyourproject.zip?alt=media&token=ced68999-c560-4bcf-b4dd-38b1bc389880",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fmaterial%2Fmaterialkitconfig.json?alt=media&token=e38c787b-52d0-4986-b680-2aad96deac05"
    },
    "nowui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fnowui%2Fyourproject.zip?alt=media&token=c60cdbc2-31ce-4ced-b31a-09565bd7d8ce",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fv2designs%2Fnowui%2Fnowui.json?alt=media&token=0c2afe20-3181-4de7-a01c-de930ef71891"
    }
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