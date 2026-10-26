import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  CustomerReview,
  OrderRecord,
  OwnerConfig,
  ProductItem,
  SupportInquiry,
} from './utils/commerce';
import { CustomerAccountPublic } from './utils/customerAccount';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message ?? String(event.reason);
    if (msg.includes('securetoken') || msg.includes('token-service-api') || msg.includes('auth/token-service')) {
      event.preventDefault();
    }
  });

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const text = args.map((arg) => String(arg)).join(' ');
    if (text.includes('securetoken') || text.includes('token-service') || text.includes('Could not reach Cloud Firestore backend')) {
      return;
    }
    originalError(...args);
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('securetoken'))) {
      console.warn('Firebase backend connection note: operating in offline/mock mode.');
    }
  }
}

void testConnection();

export async function signInWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.warn('Google Sign-In unavailable (Firebase Auth API may not be enabled):', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Sign Out warning:', error);
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  try {
    return onAuthStateChanged(
      auth,
      (user) => {
        callback(user);
      },
      (error) => {
        console.warn('Auth state change warning (Firebase Auth API may not be enabled):', error);
        callback(null);
      }
    );
  } catch (error) {
    console.warn('Subscribe to auth warning:', error);
    callback(null);
    return () => {};
  }
}

/**
 * Syncs a verified customer's prepaid order + isolated PII shipping sub-document
 * atomically using Firestore writeBatch in compliance with firestore.rules.
 */
export async function syncVerifiedOrderToFirestore(order: OrderRecord): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const cleanOrderId = order.id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const orderRef = doc(db, 'orders', cleanOrderId);
  const privateShippingRef = doc(db, 'orders', cleanOrderId, 'private', 'shipping');

  try {
    const batch = writeBatch(db);
    batch.set(orderRef, {
      orderCode: order.orderCode.slice(0, 24),
      buyerId: user.uid,
      itemTitle: (order.items[0]?.title ?? 'Elvora Electronics').slice(0, 140),
      itemImageKey: (order.items[0]?.imageKey ?? 'anc_headphones').slice(0, 64),
      quantity: Math.min(100, Math.max(1, order.items.reduce((s, i) => s + i.quantity, 0))),
      totalUsd: order.totalUsd,
      deliveryZone: order.deliveryZone,
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64),
      oemOrderRef: order.oemOrderRef.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64),
      logoImprint: order.logoImprint.slice(0, 80),
      status: 'payment_confirmed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(privateShippingRef, {
      buyerId: user.uid,
      customerName: order.customerName.slice(0, 100),
      customerPhone: order.customerPhone.slice(0, 24),
      deliveryAddress: order.deliveryAddress.slice(0, 240),
      ownerPayoutPhone: order.ownerPayoutPhone.slice(0, 24),
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${cleanOrderId}`);
  }
}

/**
 * Syncs store owner mobile configuration when signed in as verified administrator.
 */
export async function syncOwnerConfigToFirestore(config: OwnerConfig): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.email !== 'bravinbrown8@gmail.com') return;

  const ref = doc(db, 'ownerSettings', 'config');
  try {
    await setDoc(ref, {
      ownerUid: user.uid,
      payoutPhone: config.payoutPhone.slice(0, 24),
      merchantName: config.merchantName.slice(0, 80),
      autoOrderOem: config.autoOrderAlibabaOem,
      autoPostFeed: config.autoPostProductStock,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'ownerSettings/config');
  }
}

/**
 * Syncs a newly published OEM electronics product or combo when signed in as verified administrator.
 */
export async function syncProductToFirestore(product: ProductItem): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.email !== 'bravinbrown8@gmail.com') return;

  const cleanId = product.id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const ref = doc(db, 'products', cleanId);
  try {
    await setDoc(ref, {
      title: product.title.slice(0, 120),
      category: product.category,
      price: product.price,
      oemCost: product.oemCost,
      stockRemaining: product.stockRemaining,
      imageKey: product.imageKey,
      specs: product.specs.slice(0, 320),
      oemSupplier: product.oemSupplier.slice(0, 120),
      logoImprint: product.logoImprint.slice(0, 80),
      isPublished: product.isPublished,
      ownerEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${cleanId}`);
  }
}

/**
 * Syncs a public non-PII verified buyer review when signed in as a verified user.
 */
export async function syncReviewToFirestore(review: CustomerReview): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const cleanId = review.id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const cleanProdId = review.productId.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64);
  const ref = doc(db, 'reviews', cleanId);
  try {
    await setDoc(ref, {
      productId: cleanProdId,
      productTitle: review.productTitle.slice(0, 120),
      authorUid: user.uid,
      authorName: review.authorName.slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(review.rating))),
      comment: review.comment.slice(0, 400),
      isPublic: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `reviews/${cleanId}`);
  }
}

/**
 * Syncs a PII-isolated Contact Us support inquiry when signed in as a verified user.
 */
export async function syncInquiryToFirestore(inquiry: SupportInquiry): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const cleanId = inquiry.id.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128);
  const ref = doc(db, 'inquiries', cleanId);
  try {
    await setDoc(ref, {
      senderUid: user.uid,
      senderName: inquiry.senderName.slice(0, 80),
      contactInfo: inquiry.contactInfo.slice(0, 120),
      topic: inquiry.topic,
      message: inquiry.message.slice(0, 500),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `inquiries/${cleanId}`);
  }
}

/**
 * Atomically syncs an authenticated Google customer profile + isolated PII contact subdoc
 * to /customerProfiles/{uid} and /customerProfiles/{uid}/private/contact.
 */
export async function syncCustomerProfileToFirestore(
  profile: CustomerAccountPublic
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !user.email) return;

  const profileRef = doc(db, 'customerProfiles', user.uid);
  const piiRef = doc(db, 'customerProfiles', user.uid, 'private', 'contact');

  const safePhone = /^\+?[0-9 \-()]{7,24}$/.test(profile.phone.trim())
    ? profile.phone.trim()
    : '+1 555 010 2026';
  const safeAddress =
    profile.defaultAddress.trim().length >= 5
      ? profile.defaultAddress.trim().slice(0, 240)
      : 'Local Hub Pickup / Street Address Pending';
  const safeCurrency = /^[A-Z]{3}$/.test(profile.currencyCode.trim().toUpperCase())
    ? profile.currencyCode.trim().toUpperCase()
    : 'USD';

  try {
    const existingSnap = await getDoc(profileRef);
    const batch = writeBatch(db);
    if (!existingSnap.exists()) {
      batch.set(profileRef, {
        uid: user.uid,
        displayName: (profile.fullName.trim() || user.displayName || 'Elvora Member').slice(0, 80),
        countryName: (profile.countryName.trim() || 'United States (USA)').slice(0, 60),
        currencyCode: safeCurrency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(piiRef, {
        uid: user.uid,
        email: user.email.slice(0, 120),
        phone: safePhone,
        defaultAddress: safeAddress,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(profileRef, {
        displayName: (profile.fullName.trim() || user.displayName || 'Elvora Member').slice(0, 80),
        countryName: (profile.countryName.trim() || 'United States (USA)').slice(0, 60),
        currencyCode: safeCurrency,
        updatedAt: serverTimestamp(),
      });
      batch.update(piiRef, {
        phone: safePhone,
        defaultAddress: safeAddress,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `customerProfiles/${user.uid}`);
  }
}

/**
 * Loads an authenticated Google customer's saved profile + isolated PII contact subdoc.
 */
export async function fetchCustomerProfileFromFirestore(): Promise<CustomerAccountPublic | null> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !user.email) return null;

  const profileRef = doc(db, 'customerProfiles', user.uid);
  const piiRef = doc(db, 'customerProfiles', user.uid, 'private', 'contact');

  try {
    const [pubSnap, piiSnap] = await Promise.all([getDoc(profileRef), getDoc(piiRef)]);
    if (!pubSnap.exists()) return null;

    const pub = pubSnap.data();
    const pii = piiSnap.exists() ? piiSnap.data() : {};
    const nowIso = new Date().toISOString();

    return {
      id: user.uid,
      fullName: String(pub.displayName || user.displayName || 'Elvora Member'),
      email: String(pii.email || user.email),
      phone: String(pii.phone || '+1 555 010 2026'),
      countryName: String(pub.countryName || 'United States (USA)'),
      currencyCode: String(pub.currencyCode || 'USD'),
      defaultAddress: String(pii.defaultAddress || ''),
      authProvider: 'google_cloud',
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `customerProfiles/${user.uid}`);
  }
}
