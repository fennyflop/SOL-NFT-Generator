const fs = require("fs");
const console = require("console");
const { createCanvas, loadImage } = require("canvas");

const boilerPlate = require('./boilerplate-meta.js');

let quantity = 1;

const names = ['clown', 'player', 'ghoul', 'kitten', 'zombie'];

const imageFormat = {
    width: 300,
    height: 300,
};

const dir = {
    imageFormat: '.png',
    outputs: `./outputs`,
    traits : `./layers/traits`,
    backgrounds: `./layers/backgrounds`,
}

const canvas = createCanvas(imageFormat.width, imageFormat.height);

const ctx = canvas.getContext("2d");

const recreateOutputsDir = () => {
    if (fs.existsSync(dir.outputs)) fs.rmdirSync(dir.outputs, { recursive: true });
    fs.mkdirSync(dir.outputs);
    fs.mkdirSync(`${dir.outputs}/metadata`);
    fs.mkdirSync(`${dir.outputs}/teenagers`);
};

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

const getPermutations = (arraysToCombine, max) => {
    let permsCount = 1;
    const divisors = [];
  
    for (let i = arraysToCombine.length - 1; i >= 0; i--) {
      divisors[i] = divisors[i + 1] ? divisors[i + 1] * arraysToCombine[i + 1].length : 1;
      permsCount *= (arraysToCombine[i].length || 1);
    }
  
    if(!!max && max>0) {
      permsCount = max;
    }
  
    totalOutputs = permsCount;
  
    const getCombination = (n, arrays, divisors) => arrays.reduce((acc, arr, i) => {
        acc.push(arr[Math.floor(n / divisors[i]) % arr.length]);
        return acc;
    }, []);
  
    const combinations = [];
    for (let i = 0; i < permsCount; i++) {
        combinations.push(getCombination(i, arraysToCombine, divisors));
    }
  
    return combinations;
};

const createMetadata = (traits, background, index) => {
    const response = JSON.parse(JSON.stringify(boilerPlate));

    response["description"] = `just an ordinary ${background} teenager.`;
    response["name"] = `${background} ${names[Math.floor(Math.random() * names.length)]} N${index}`;

    response["properties"]["files"][0] = {
        "type": "image/png",
        "uri": `${quantity - 1}.png`,
        // "uri": `https://ipfs.io/ipfs/QmSgWNbzwUXvvu2dszNpWwPPEPeq9AJuqYWifdp7m78BUz/${quantity - 1}.png`,
    }

    const attributes = JSON.parse(JSON.stringify(traits)).map((trait) => {
        trait.value = trait.value.split(dir.imageFormat)[0]; // remove png
        return trait;
    });

    response["attributes"] = attributes;

    return response;
}

const drawImage = async (traits, background, index) => {
    const backgroundName = background.substring(-1, background.length - 4);
    const backgroundImage = await loadImage(`${dir.backgrounds}/${background}`);
    
    ctx.drawImage(backgroundImage, 0, 0, imageFormat.width, imageFormat.height);
  
    for (let index = 0; index < traits.length; index++) {
        const {value, trait_type: trait} = traits[index];
        const image = await loadImage(`${dir.traits}/${trait}/${value}`);
        ctx.drawImage(image, 0, 0, imageFormat.width, imageFormat.height);
    }
    
    const imageMetadata = createMetadata(traits, backgroundName, index + 1);
  
    // Save Metadata
    fs.writeFileSync(
      `${dir.outputs}/metadata/${quantity - 1}.json`,
      JSON.stringify(imageMetadata, null, 2),
      function(err){
        if(err) throw err;
      }
    )
  
    // Save Image 
    fs.writeFileSync(
      `${dir.outputs}/teenagers/${quantity - 1}.png`, 
      canvas.toBuffer("image/png")
    );
}

const main = async (outputs) => {
    const backgrounds = fs.readdirSync(dir.backgrounds);
    const possibleTraits = fs.readdirSync(dir.traits).map((trait) => {
        const modifiedValues = [];
        fs.readdirSync(`${dir.traits}/${trait}`).forEach((value) => {
            modifiedValues.push({trait_type: trait, value: value});
        })
        return modifiedValues;
    });

    const possibleNFTs = shuffle(getPermutations(possibleTraits, outputs));

    for (let i = 0; i < backgrounds.length; i++) {
        for (let n = 0; n < 25; n++) {
            await drawImage(possibleNFTs[quantity - 1] , backgrounds[i], n);
            ++quantity;
        }
    }
}

(() => {
    recreateOutputsDir();
  
    main(process.argv[2]);
})();