import { AppMetadata, EncryptedPayload, DriveFolderConfig } from '../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
export const DEFAULT_FOLDER_NAME = 'Keep Notes (Encrypted)';

interface DriveFileItem {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Ensures the dedicated Keep Notes folder exists in Google Drive
 */
export async function getOrCreateKeepFolder(
  accessToken: string,
  folderName: string = DEFAULT_FOLDER_NAME
): Promise<DriveFolderConfig> {
  // Check if folder exists
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    throw new Error(`Failed to search Google Drive folders: ${searchRes.status} ${errorBody}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      folderId: searchData.files[0].id,
      folderName: searchData.files[0].name,
    };
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Google Keep Notes with End-to-End Encryption',
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${createRes.status} ${errorBody}`);
  }

  const folder = await createRes.json();
  return {
    folderId: folder.id,
    folderName: folder.name,
  };
}

/**
 * Loads the encrypted workspace metadata (canary, salt, labels)
 */
export async function loadMetadata(
  accessToken: string,
  folderId: string
): Promise<{ metadata: AppMetadata | null; fileId: string | null }> {
  const query = encodeURIComponent(`'${folderId}' in parents and name = 'keep_metadata.json' and trashed = false`);
  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    throw new Error(`Failed to check metadata file: ${searchRes.status}`);
  }

  const data = await searchRes.json();
  if (!data.files || data.files.length === 0) {
    return { metadata: null, fileId: null };
  }

  const fileId = data.files[0].id;
  const contentRes = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!contentRes.ok) {
    throw new Error(`Failed to download metadata file: ${contentRes.status}`);
  }

  const metadata = await contentRes.json();
  return { metadata, fileId };
}

/**
 * Saves or updates workspace metadata in Google Drive
 */
export async function saveMetadata(
  accessToken: string,
  folderId: string,
  metadata: AppMetadata,
  existingFileId?: string | null
): Promise<string> {
  const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
    type: 'application/json',
  });

  if (existingFileId) {
    const patchRes = await fetch(`${DRIVE_UPLOAD_URL}/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: metadataBlob,
    });
    if (!patchRes.ok) {
      throw new Error(`Failed to update metadata: ${patchRes.status}`);
    }
    return existingFileId;
  }

  // Create multipart file upload
  const boundary = '-------KeepMetadataBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileMetadata = {
    name: 'keep_metadata.json',
    mimeType: 'application/json',
    parents: [folderId],
  };

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata, null, 2) +
    closeDelimiter;

  const createRes = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create metadata file in Drive: ${createRes.status}`);
  }

  const resData = await createRes.json();
  return resData.id;
}

/**
 * Lists all note files currently in the Google Drive folder
 */
export async function listNoteFiles(
  accessToken: string,
  folderId: string
): Promise<DriveFileItem[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and name contains 'note_' and mimeType = 'application/json' and trashed = false`);
  const res = await fetch(
    `${DRIVE_API_URL}/files?q=${query}&fields=files(id,name,modifiedTime,size)&pageSize=500`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to list note files: ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads the encrypted content of a single note file
 */
export async function downloadNotePayload(
  accessToken: string,
  fileId: string
): Promise<EncryptedPayload> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download note file ${fileId}: ${res.status}`);
  }

  return await res.json();
}

/**
 * Uploads or updates an encrypted note file in the Google Drive folder
 */
export async function uploadNotePayload(
  accessToken: string,
  folderId: string,
  noteId: string,
  payload: EncryptedPayload,
  existingFileId?: string | null
): Promise<string> {
  const bodyText = JSON.stringify(payload, null, 2);

  if (existingFileId) {
    const updateRes = await fetch(`${DRIVE_UPLOAD_URL}/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: bodyText,
    });

    if (!updateRes.ok) {
      // If file was deleted remotely or not found, fall back to creating a new one
      if (updateRes.status === 404) {
        return uploadNotePayload(accessToken, folderId, noteId, payload, null);
      }
      throw new Error(`Failed to update note file: ${updateRes.status}`);
    }

    return existingFileId;
  }

  // Create new file
  const boundary = '-------KeepNoteBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileMetadata = {
    name: `note_${noteId}.json`,
    mimeType: 'application/json',
    parents: [folderId],
    description: `Encrypted note created on ${payload.updatedAt}`,
  };

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    bodyText +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create note file in Drive: ${res.status} ${err}`);
  }

  const created = await res.json();
  return created.id;
}

/**
 * Permanently deletes a note file from Google Drive (Invoked only after user confirmation!)
 */
export async function deleteNoteFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete note file: ${res.status}`);
  }
}
