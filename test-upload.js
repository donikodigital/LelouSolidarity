const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'gltn9eo4',
  api_key: '717527865991771',
  api_secret: '5l_888skTMd8b5ab1zJzQ2U-hSg',
});
cloudinary.uploader.upload('./package.json', { resource_type: 'raw', folder: 'lelou-solidarity/test' })
  .then(r => console.log('SUCCES:', r.secure_url))
  .catch(e => console.log('ECHEC:', e.message || e));
