import axios from 'axios';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

export async function uploadToIPFS(data: any, name: string): Promise<string | null> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn("Pinata keys missing in .env.local. Falling back to simulation.");
    return null;
  }

  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  const body = {
    pinataContent: data,
    pinataMetadata: {
      name: name,
    },
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    if (response.status === 200) {
      return `ipfs://${response.data.IpfsHash}`;
    }
    return null;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return null;
  }
}
