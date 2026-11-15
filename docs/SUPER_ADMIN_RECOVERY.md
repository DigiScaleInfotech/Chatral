# Super Admin Creation & Recovery Guide (Chatral)

આ ડોક્યુમેન્ટમાં સુપર એડમિન (Super Admin) એકાઉન્ટ કઈ રીતે બનાવવું, રિકવર કરવું અથવા જો ભૂલથી ડેટાબેઝમાંથી ડિલીટ થઈ ગયું હોય તો ફરીથી કઈ રીતે ક્રિએટ કરવું તેની સંપૂર્ણ માર્ગદર્શિકા (Step-by-Step Guide) આપેલ છે.

---

## 📌 પરિચય (Overview)
Chatral સિસ્ટમમાં બે મુખ્ય રોલ છે:
- **`SUPER_ADMIN`**: સંપૂર્ણ પ્લેટફોર્મનું નિયંત્રણ (તમામ Store Tenancies, Widget Controls અને ગ્લોબલ User Directory).
- **`USER` (Store Roles: OWNER / ADMIN / SUPERVISOR / AGENT)**: ફક્ત તેમના ચોક્કસ સ્ટોર પૂરતું એક્સેસ.

જો ક્યારેય ડેટાબેઝમાંથી સુપર એડમિન ડીલીટ થઈ જાય, તો નીચે આપેલા ૩ વિકલ્પોમાંથી કોઈપણ એક વિકલ્પનો ઉપયોગ કરી શકો છો:

---

## 🔹 વિકલ્પ ૧: Built-in `seed` સ્ક્રિપ્ટ (સૌથી ઝડપી અને સરળ)

પ્રોજેક્ટના સર્વરમાં ઓલરેડી `seed.js` સ્ક્રિપ્ટ તૈયાર રાખેલી છે.

### સ્ટેપ:
1. ટર્મિનલમાં પ્રોજેક્ટના `server` ડિરેક્ટરીમાં જાઓ:
   ```bash
   cd server
   ```

2. નીચેનો કમાન્ડ રન કરો:
   ```bash
   npm run seed
   ```

### આ કેવી રીતે કામ કરે છે?
- આ કમાન્ડ તમારી `server/.env` ફાઈલમાં રહેલા `ADMIN_EMAIL` અને `ADMIN_PASSWORD` ની વિગતો વાંચીને ઓટોમેટિક નવો `SUPER_ADMIN` એકાઉન્ટ બનાવી દેશે.
- ડિફોલ્ટ ક્રેડેન્શિયલ્સ:
  - **Email:** `admin@example.com`
  - **Password:** `Admin@123456`

### કસ્ટમ ઇમેઇલ અને પાસવર્ડ સાથે રન કરવું હોય તો:
જો તમારે કોઈ ચોક્કસ ઇમેઇલ (જેમ કે તમારો પર્સનલ ઇમેઇલ) સુપર એડમિન તરીકે સેટ કરવો હોય, તો કમાન્ડ લાઈનમાં જ વેલ્યુ પાસ કરી શકો છો:
```bash
cd server
ADMIN_EMAIL="chatral.official@gmail.com" ADMIN_PASSWORD="YourSecurePassword123" npm run seed
```
> **નોંધ:** જો આ ઇમેઇલ ડેટાબેઝમાં પહેલેથી જ મોજૂદ હશે, તો આ સ્ક્રિપ્ટ તેને ડિલીટ કર્યા વગર સીધો જ `SUPER_ADMIN` રોલમાં પ્રમોટ (અપગ્રેડ) કરી દેશે!

---

## 🔹 વિકલ્પ ૨: Prisma Studio (વિઝ્યુઅલ UI - બ્રાઉઝરમાંથી)

જો તમારે ટર્મિનલ કમાન્ડ્સ ટાઈપ કરવા ન હોય અને બ્રાઉઝરમાં જોઈને ગ્રાફિકલ ઈન્ટરફેસ (GUI) દ્વારા સુપર એડમિન બનાવવો કે અપડેટ કરવો હોય:

### સ્ટેપ:
1. ટર્મિનલમાં `server` ફોલ્ડરમાં જાઓ:
   ```bash
   cd server
   ```

2. Prisma Studio શરૂ કરો:
   ```bash
   npx prisma studio
   ```

3. તમારા બ્રાઉઝરમાં ઓટોમેટિક **`http://localhost:5555`** ખૂલશે (અથવા બ્રાઉઝરમાં જાતે આ URL ખોલો).

4. **`User`** ટેબલ પર ક્લિક કરો:
   - **જો પહેલેથી બનેલા યુઝરને સુપર એડમિન બનાવવો હોય:**
     1. જે યુઝરને સુપર એડમિન બનાવવો હોય તેની લાઈન શોધો.
     2. તેની **`role`** કોલમ પર ડબલ ક્લિક કરો.
     3. ડ્રોપડાઉનમાંથી **`SUPER_ADMIN`** સિલેક્ટ કરો.
     4. નીચે લીલા બટન **"Save 1 change"** પર ક્લિક કરો.
   - **જો સાવ નવો સુપર એડમિન બનાવવો હોય:**
     1. ઉપર **"Add record"** બટન પર ક્લિક કરો.
     2. `email`, `name` અને `role` માં **`SUPER_ADMIN`** સેટ કરો.
     3. નીચે **"Save 1 change"** પર ક્લિક કરો.

---

## 🔹 વિકલ્પ ૩: Direct Node CLI One-Liner (કોઈપણ મોજૂદ એકાઉન્ટને તાત્કાલિક પ્રમોટ કરવા)

જો તમે વેબસાઇટ પરથી સાઇન-અપ કરીને સામાન્ય એકાઉન્ટ બનાવેલું હોય (દા.ત. `chatral.official@gmail.com`), અને તેને જ સીધો સુપર એડમિન પાવર આપવો હોય:

### સ્ટેપ:
ટર્મિનલમાં ફક્ત આ એક કમાન્ડ પેસ્ટ કરીને એન્ટર આપો:

```bash
cd server
node -e "import('./src/config.js').then(async ({ prisma }) => {
  const email = 'chatral.official@gmail.com'; // <-- તમારો ઈમેલ અહીં લખો
  await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN', isActive: true }
  });
  console.log('✅ Successfully promoted ' + email + ' to SUPER_ADMIN!');
  await prisma.\$disconnect();
});"
```

જો સફળ થશે તો ટર્મિનલમાં મેસેજ આવશે:
`✅ Successfully promoted chatral.official@gmail.com to SUPER_ADMIN!`

---

## 🔐 પાસવર્ડ ભૂલી ગયા હોવ ત્યારે નવો પાસવર્ડ સેટ કરવો

જો સુપર એડમિન એકાઉન્ટ મોજૂદ છે પણ પાસવર્ડ યાદ નથી, તો નીચેનો વન-લાઇનર કમાન્ડ ચલાવીને નવો પાસવર્ડ સેટ કરી શકાય છે:

```bash
cd server
node -e "import('./src/config.js').then(async ({ prisma }) => {
  import('bcryptjs').then(async (bcrypt) => {
    const email = 'chatral.official@gmail.com'; // <-- તમારો ઈમેલ
    const newPass = 'NewPassword123';         // <-- નવો પાસવર્ડ (ઓછામાં ઓછા 10 અક્ષર)
    const hash = await bcrypt.default.hash(newPass, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash, role: 'SUPER_ADMIN', isActive: true }
    });
    console.log('✅ Password reset and user updated to SUPER_ADMIN!');
    await prisma.\$disconnect();
  });
});"
```

---

## 📋 ઝડપી સંદર્ભ સારાંશ (Cheat Sheet)

| જરૂરિયાત | સૌથી સરળ રીત | કમાન્ડ |
| :--- | :--- | :--- |
| ફટાફટ નવો એડમિન બનાવવો | `npm run seed` | `cd server && npm run seed` |
| કસ્ટમ ઇમેઇલથી બનાવવો | Env સાથે seed | `cd server && ADMIN_EMAIL="xyz@abc.com" ADMIN_PASSWORD="secret" npm run seed` |
| બ્રાઉઝર GUI માંથી સુધારો કરવો | Prisma Studio | `cd server && npx prisma studio` |
| મોજૂદ યુઝરને એડમિન બનાવવો | Node One-liner | `cd server && node -e "..."` (વિકલ્પ ૩ મુજબ) |

