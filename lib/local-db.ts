import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "local_db.json");

interface LocalUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  profile: {
    id: string;
    userId: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    accentColor: string;
    backgroundType: string;
    backgroundUrl: string;
    audioUrl: string;
    audioTitle: string;
    isLive: boolean;
    livePlatform: string;
    sepayBank: string;
    sepayAccountNumber: string;
    sepayAccountName: string;
    widgets: any[];
  };
}

interface LocalDatabase {
  users: LocalUser[];
}

function ensureDataFile(): LocalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: LocalDatabase = { users: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { users: [] };
  }
}

function saveDatabase(data: LocalDatabase) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function findLocalUserByIdentifier(identifier: string): LocalUser | null {
  const db = ensureDataFile();
  const clean = identifier.trim().toLowerCase();
  return (
    db.users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    ) || null
  );
}

export function findLocalUserById(id: string): LocalUser | null {
  const db = ensureDataFile();
  return db.users.find((u) => u.id === id) || null;
}

export function createLocalUser(params: {
  username: string;
  email: string;
  passwordHash: string;
}): LocalUser {
  const db = ensureDataFile();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanUsername = params.username.trim().toLowerCase();

  const newUser: LocalUser = {
    id,
    username: cleanUsername,
    email: params.email.trim().toLowerCase(),
    passwordHash: params.passwordHash,
    role: "CREATOR",
    createdAt: new Date().toISOString(),
    profile: {
      id: `prof_${id}`,
      userId: id,
      displayName: cleanUsername.toUpperCase(),
      bio: "Chào mừng bạn đến với trang Bio cá nhân của tôi!",
      avatarUrl: "",
      accentColor: "#6366f1",
      backgroundType: "GRADIENT",
      backgroundUrl: "",
      audioUrl: "",
      audioTitle: "Soundtrack Flow",
      isLive: false,
      livePlatform: "NONE",
      sepayBank: process.env.SEPAY_DEFAULT_BANK || "MBBank",
      sepayAccountNumber: process.env.SEPAY_DEFAULT_ACC || "03810002009",
      sepayAccountName: process.env.SEPAY_DEFAULT_NAME || "BUI VAN THU NOOB",
      widgets: [
        {
          id: `w-${Date.now()}-1`,
          type: "LIVE_STREAM",
          title: "🔴 LIVE STREAM BROADCAST",
          gridSpanX: 2,
          gridSpanY: 2,
          sortOrder: 0,
          isEnabled: true,
          configJson: {},
        },
        {
          id: `w-${Date.now()}-2`,
          type: "TIP_JAR",
          title: "Donate Ủng Hộ Stream",
          gridSpanX: 2,
          gridSpanY: 1,
          sortOrder: 1,
          isEnabled: true,
          configJson: {
            donationGoal: 1000000,
            currentAmount: 0,
            currency: "VND",
            qrCodeUrl: "https://qr.sepay.vn/img?acc=03810002009&bank=MBBank&amount=50000",
          },
        },
      ],
    },
  };

  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
}

export function updateLocalProfile(
  userId: string,
  profileData: any,
  widgetsData: any[]
): boolean {
  const db = ensureDataFile();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return false;

  user.profile = {
    ...user.profile,
    displayName: profileData.displayName || user.profile.displayName,
    bio: profileData.bio ?? user.profile.bio,
    avatarUrl: profileData.avatarUrl ?? user.profile.avatarUrl,
    accentColor: profileData.accentColor || user.profile.accentColor,
    backgroundType: profileData.backgroundType || user.profile.backgroundType,
    backgroundUrl: profileData.backgroundUrl ?? user.profile.backgroundUrl,
    audioUrl: profileData.audioUrl ?? user.profile.audioUrl,
    audioTitle: profileData.audioTitle || user.profile.audioTitle,
    sepayBank: profileData.sepayBank || user.profile.sepayBank,
    sepayAccountNumber: profileData.sepayAccountNumber || user.profile.sepayAccountNumber,
    sepayAccountName: profileData.sepayAccountName || user.profile.sepayAccountName,
    widgets: widgetsData || user.profile.widgets,
  };

  saveDatabase(db);
  return true;
}
