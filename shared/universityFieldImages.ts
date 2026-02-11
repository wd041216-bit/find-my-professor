/**
 * University + Research Field Image Mapping
 * Maps university name and research field to specific background images
 */

export const universityFieldImages: Record<string, Record<string, string>> = {
  "MIT": {
    "Engineering": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/bOIRfnRRQOtedYRK.png",
    "Computer Science": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/XSABYGFxrRkoxItQ.png",
    "Literature & Languages": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/lhBNAKpiFbwYcgTF.png",
    "Sociology & Anthropology": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/kJqbesehokOUVSdR.png",
    "History": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/tVtfMhjeSWojnnRR.png",
    "Economics": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/UuLAjwnKnDqHpCnv.png",
    "Biology": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/tdNVXyTtXxsrlNka.png",
    "Physics": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/mhXEVNijtMAcrVIm.png",
    "Mathematics": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/jcoighUiTNafRjyQ.png",
    "Chemistry": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/ElgXhPBIGdMBfiqb.png",
    "Political Science": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/OkKbZhYvIKuPbRGf.png",
    "Medicine & Health": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/euvRQQkzbdfEqlll.png",
    "Architecture & Planning": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/BTbqJdHsaWUXhFEN.png",
    "Arts & Design": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/rBhAlAXiJeCBQHqE.png",
    "Business & Management": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/bcxNbkCNewKAWRQi.png",
    "Education": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/RamnRwNzqqZzibym.png",
    "Environmental Science": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/jWXddciZTBtppsQu.png",
    "Music & Theater": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/KWTuHxxmTCXBWjNR.png",
    "Philosophy": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/XiGuOgQLXPhLLWah.png",
  },
  "Princeton University": {
    "Computer Science": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/iZMyzTeIuImUsvjR.png",
    "History": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/YsZFhHihqzElMABA.png",
    "Sociology & Anthropology": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/KuQqZpxhYiPuJIMc.png",
    "Physics": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/PBkLtswuZRMbGJrZ.png",
    "Engineering": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/ciRmogRkDaWAVveU.png",
    "Economics": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/wLbVaKQiRBHZDiLe.png",
  },
  "University of Washington": {
    "Computer Science": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/nniCrMJMudYfMKNS.png",
    "Medicine & Health": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/gHUUTYYjHhoeZbog.png",
    "Sociology & Anthropology": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/RoNWsKRlHXFSVQsy.png",
    "Engineering": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/BsBhykelAAVYAlMV.png",
    "Education": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/bxzKhqqjcNlJVCWR.png",
    "Economics": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/KUlNoZjWUKfCtOCH.png",
  },
};

/**
 * Get background image URL for a professor based on university and research field
 * Falls back to generic gradient if no specific image is found
 */
export function getProfessorBackgroundImage(
  universityName: string,
  researchField: string
): string | null {
  const universityImages = universityFieldImages[universityName];
  if (!universityImages) {
    return null; // No images for this university, use default gradient
  }

  const imageUrl = universityImages[researchField];
  return imageUrl || null; // Return image URL or null for default gradient
}
