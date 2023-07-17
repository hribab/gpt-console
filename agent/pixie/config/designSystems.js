const designSystems = {
    "blk": {
        "description": "The dark theme and sleek, modern design of this system can lend an air of sophistication and innovation to your landing page. This can be particularly effective if your product or service is tech-oriented or you're targeting a younger demographic."
    },
    "paperui": {
        "description": "With its unique, sketch-like aesthetic, the Paper Kit can give your landing page a distinctive and friendly look and feel. This could be a good choice if you're aiming for an informal or artistic vibe or want your brand to seem more approachable."
    },
   
};




// "material": {
//     "description": "Material Design's clean, simple, and intuitive interfaces can help visitors quickly understand your product or service, making it a good choice for a landing page. This design system's straightforwardness could be especially beneficial if your offering is complex or technical and you want to present it in an easily digestible way."
// },

// "nowui": {
//     "description": "Known for its vibrant colors and clean lines, the Now UI Kit can make your landing page appear professional and energetic. This could be a fitting choice if you want your brand to come across as both reliable and dynamic."
// }

//TODO: add config files for other design systems
const skeletonAndConfigURL = {
    "blk": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblk%2Fyourproject.zip?alt=media&token=79d2fe5d-71db-4eb7-8369-50cff7a3b685",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fblkconfig.json?alt=media&token=f0f02157-dce6-4c1c-a2b3-e0ccda8e158d"
    },
    "paperui": {
        "skeleton": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperkit%2Fyourproject.zip?alt=media&token=8788975f-fde3-4065-909b-558b3d1c3e43",
        "config": "https://firebasestorage.googleapis.com/v0/b/gptconsole.appspot.com/o/templatecodefiles%2Fpaperuiconfig.json?alt=media&token=3bef3a94-f615-47b9-a616-b8f98b34df6e"
    }
};



module.exports = {
    designSystems,
    skeletonAndConfigURL
}