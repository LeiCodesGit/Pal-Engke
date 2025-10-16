import multer from "multer";
const storage = multer.memoryStorage(); // keeps file in memory instead of saving to disk
const upload = multer({ storage });
export default upload;
