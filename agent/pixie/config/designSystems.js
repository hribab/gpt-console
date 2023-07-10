const designSystems = {
    "blk": {
        "description": "The dark theme and sleek, modern design of this system can lend an air of sophistication and innovation to your landing page. This can be particularly effective if your product or service is tech-oriented or you're targeting a younger demographic."
    },
    "material": {
        "description": "Material Design's clean, simple, and intuitive interfaces can help visitors quickly understand your product or service, making it a good choice for a landing page. This design system's straightforwardness could be especially beneficial if your offering is complex or technical and you want to present it in an easily digestible way."
    },
    "paperui": {
        "description": "With its unique, sketch-like aesthetic, the Paper Kit can give your landing page a distinctive and friendly look and feel. This could be a good choice if you're aiming for an informal or artistic vibe or want your brand to seem more approachable."
    },
    "nowui": {
        "description": "Known for its vibrant colors and clean lines, the Now UI Kit can make your landing page appear professional and energetic. This could be a fitting choice if you want your brand to come across as both reliable and dynamic."
    }
};

//TODO: add config files for other design systems
const skeletonFiles = {
    "nowui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fnowuiskeleton.zip?alt=media&token=0e0ffc1f-efa9-4f5c-a307-c326a0bb2e28",
        "config": ""
    },
    "paperui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperkit%2Fyourproject.zip?alt=media&token=8788975f-fde3-4065-909b-558b3d1c3e43",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperuiconfig.json?alt=media&token=566ae342-d5e0-47c0-a14d-4c798810383f"
    }
};



module.exports = {
    designSystems,
    skeletonFiles
}