import { get, writable } from "svelte/store";
import { PlanStatus, type IUserPlan } from "@nucleum/schema/account/subscription";
import { UserDataMode, UserSessionType, type UserAccount, type UserInformation } from "@nucleum/client/runtime/account/account.type";
import { postDataToParent } from "@nucleum/client/runtime/embed/embed.utils";
import { Persistence } from "@nucleum/persistence/persistence";
import { performApiCall } from "@21n/utils/network.utils";
import { determineIfOffline } from "@nucleum/client/runtime/connectivity";
import {
  confirmationNotification,
  toasts
} from "@nucleum/stores/notification.store";
import { ButtonVariant } from "@21n/elements/button/button.type";
import { appStore } from "@nucleum/stores/app.store";
import {
  getBucketNameandKey,
  hasLegacyCloudSession,
  signout
} from "@21n/utils/account.utils";
import { determineIfPlanIsActive, determineIfSubscriptionExpired } from "@nucleum/client/runtime/account/plan.utils";
import { PlanType } from "@nucleum/schema/account/subscription";
import { ObservableStore } from "@nucleum/stores/client.store";
import { StoreDataType } from "@nucleum/schema/legacy/store-data-type.enum";
import { type IRecordId } from "@nucleum/schema/legacy/data.type";
import {
  clientStorage,
  deleteIndexedDbDatabase
} from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import {
  clearDatafnLocalData,
  datafn,
  destroyNucleumDatafn
} from "@nucleum/datafn/datafn.store";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import { Resource } from "@nucleum/datafn/resource.enum";
import { dispatchCustomEvent } from "@21n/utils/browser.utils";
import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";
import context from "@nucleum/stores/context.store";
import { compressImageToTargetSize } from "@21n/utils/ui.utils";
import { convertHeicToPng } from "@21n/utils/ui.utils";
import { generateImagePreviewFromPdf } from "@21n/utils/pdf.utils";
import { Action } from "@nucleum/client/config/action.enum";
import { EmbedDataMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
import { parse } from "@21n/shared-utils/json.utils";
import {
  bootstrapNucleusAccount,
  resolveAuthSession,
  shouldUseAuthFnBearerSession
} from "@nucleum/client/runtime/account/auth";
import { resolveAccountBaseUrl } from "@nucleum/client/runtime/account/network";
import { clearCachedDatafnE2eeState } from "@nucleum/datafn/datafnE2ee.store";
import { clearLegacySurrealLocalData } from "@nucleum/persistence/legacyLocalDataBackup";

export const isRefreshingToken = writable(false);

export function resolveStoredUserInformation(
  value: string | null
): UserInformation | undefined {
  if (!value) return undefined;
  try {
    const parsed = parse(value) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as { id?: unknown }).id !== "string" ||
      !(parsed as { id: string }).id
    ) {
      return undefined;
    }
    return parsed as UserInformation;
  } catch {
    return undefined;
  }
}

export function resolveStoredUserPlan(
  value: string | null
): IUserPlan | undefined {
  if (!value) return undefined;
  try {
    const parsed = parse(value) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Object.values(PlanType).includes(
        (parsed as { plan?: PlanType }).plan as PlanType
      )
    ) {
      return undefined;
    }
    return parsed as IUserPlan;
  } catch {
    return undefined;
  }
}

class AccountStore extends ObservableStore<UserAccount> {
  persistence = new Persistence();
  constructor() {
    super("account", StoreDataType.NA);
  }

  async init() {
    let seed: UserAccount = {
      dataMode: UserDataMode.NONE,
      sessionType: UserSessionType.UNDETERMINED
    };
    const shouldUseBearerSession = shouldUseAuthFnBearerSession();
    const authFnToken = shouldUseBearerSession
      ? await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN)
      : null;
    const offlineSessionId = await clientStorage.get(
      ClientStorageKey.OFFLINE_SESSION_ID
    );
    const storedUserInfo = await clientStorage.get(ClientStorageKey.USER_INFO);
    const userInfo = resolveStoredUserInformation(storedUserInfo);
    const storedPlan = resolveStoredUserPlan(
      await clientStorage.get(ClientStorageKey.USER_PLAN)
    );
    const storedUser = await clientStorage.get(ClientStorageKey.USER);
    const hasStoredCloudIdentity = Boolean(
      authFnToken || userInfo || storedUser
    );
    if (!shouldUseBearerSession) {
      await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
    }
    if (authFnToken) {
      seed.token = authFnToken;
      seed.dataMode = UserDataMode.CLOUD;
      seed.sessionType = UserSessionType.RETURNING;
    } else if (offlineSessionId && !hasStoredCloudIdentity) {
      seed.dataMode = UserDataMode.LOCAL;
      seed.sessionType = UserSessionType.RETURNING;
    }
    if (userInfo) {
      seed.userInfo = userInfo;
      seed.userId = userInfo.id.split("user:")[1];
      seed.plan = storedPlan;
      seed.dataMode = UserDataMode.CLOUD;
      seed.sessionType = UserSessionType.RETURNING;
    }
    this.set(seed);
    this.postToEmbed(seed);
  }

  async postToEmbed(data: any = null) {
    if (!data) {
      const token = shouldUseAuthFnBearerSession()
        ? await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN)
        : undefined;
      const userInfo = parse(
        (await clientStorage.get(ClientStorageKey.USER_INFO)) ?? ""
      );
      data = { token, userInfo };
    }
    if (!data) return;
    postDataToParent(EmbedDataMessage.ACCOUNT, {
      userId: data.userInfo?.id?.split("user:")[1],
      token: data.token,
      regionId: data.userInfo?.region,
      accountUrl: data.userInfo?.region
        ? resolveAccountBaseUrl(data.userInfo.region)
        : undefined,
      isLoggedIn: true
    });
  }

  async signIn(
    data: {
      userInfo: UserInformation;
      token: string;
    },
    params: {
      isNewUser?: boolean;
      persistToken?: boolean;
    } = { isNewUser: false }
  ) {
    const shouldPersistToken =
      params.persistToken ?? shouldUseAuthFnBearerSession();
    if (shouldPersistToken) {
      await clientStorage.set(ClientStorageKey.AUTHFN_TOKEN, data.token);
    } else {
      await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
    }
    await clientStorage.remove(ClientStorageKey.STOKEN);
    await clientStorage.set(ClientStorageKey.USER_INFO, data.userInfo);
    this.postToEmbed({
      token: shouldPersistToken ? data.token : undefined,
      userInfo: data.userInfo
    });
    this.update(() => {
      return {
        token: shouldPersistToken ? data.token : undefined,
        dataMode: UserDataMode.CLOUD,
        userId: data.userInfo.id.split("user:")[1],
        userInfo: data.userInfo,
        sessionType: params.isNewUser
          ? UserSessionType.NEW
          : UserSessionType.RETURNING
      };
    });
    this.gotoPostAuthRoute({ isNewUser: params.isNewUser });
  }

  gotoPostAuthRoute(params?: { isNewUser?: boolean }) {
    const targetPath = params?.isNewUser ? "/onboarding" : "/";
    logger.info({
      at: "account.gotoPostAuthRoute",
      targetPath,
      isNewUser: params?.isNewUser,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : undefined
    });
    if (params?.isNewUser) {
      appStore.gotoPath("/onboarding");
    } else {
      appStore.gotoPath("/");
    }
  }

  async signOut(params?: {
    isPreventDapIdClear?: boolean;
    isPreventRedirect?: boolean;
  }) {
    try {
      await destroyNucleumDatafn();
    } catch (error) {
      logger.error({ at: "account.signOut.destroyDatafn", error });
    }
    await clearCachedDatafnE2eeState();
    this.update(() => {
      const n = {
        sessionType: UserSessionType.UNDETERMINED,
        dataMode: UserDataMode.NONE
      };
      return n;
    });
    // TODO - this is causing issue in macOS app - signout is not working
    // await flux?.terminate();
    await signout(params, "signOut account.store");
  }
  async embedOAuthSignin(token: string) {
    await clientStorage.set(ClientStorageKey.AUTHFN_TOKEN, token);
    await clientStorage.remove(ClientStorageKey.STOKEN);
    const response = await this.resolveAuthFnSessionUserInfo();
    if (response?.userInfo) {
      this.signIn({
        userInfo: response?.userInfo,
        token
      });
    } else {
      logger.error({ at: "account.embedOAuthSignin", response });
    }
  }

  async signInFromAuthFnSession(params?: {
    token?: string;
    session?: any;
    regionId?: string;
    isNewUser?: boolean;
    isPreventRedirect?: boolean;
    persistToken?: boolean;
  }) {
    const shouldPersistToken =
      params?.persistToken ?? shouldUseAuthFnBearerSession();
    const previousAuthFnToken = shouldPersistToken
      ? await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN)
      : undefined;
    const hasTokenFromResponse = Boolean(params?.token?.trim());
    if (shouldPersistToken && hasTokenFromResponse && params?.token) {
      await clientStorage.set(ClientStorageKey.AUTHFN_TOKEN, params.token);
    } else if (!shouldPersistToken) {
      await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
    }
    if (params?.regionId) {
      await clientStorage.set(ClientStorageKey.REGION, params.regionId);
    }

    let authSession = params?.session;
    if (!authSession) {
      const { authClient } = await import("@nucleum/client/runtime/account/auth");
      const response = await (
        await authClient({ isPreventCachedInstance: true })
      ).getSession();
      if (response.ok && response.data.session) {
        authSession = response.data.session;
      }
      if (!response.ok || !response.data.session) {
        logger.error({
          at: "account.signInFromAuthFnSession.session.failed",
          hasTokenFromResponse,
          error: response.ok ? undefined : response.error
        });
      }
    }

    if (!authSession) {
      if (shouldPersistToken && hasTokenFromResponse) {
        if (previousAuthFnToken) {
          await clientStorage.set(
            ClientStorageKey.AUTHFN_TOKEN,
            previousAuthFnToken
          );
        } else {
          await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
        }
      }
      return false;
    }

    const sessionToken = shouldPersistToken
      ? (params?.token ?? previousAuthFnToken ?? undefined)
      : undefined;
    if (shouldPersistToken && sessionToken) {
      await clientStorage.set(ClientStorageKey.AUTHFN_TOKEN, sessionToken);
    } else {
      await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
    }
    await clientStorage.remove(ClientStorageKey.STOKEN);
    await clientStorage.set(ClientStorageKey.USER, authSession);

    const userInfo = this.resolveUserInfoFromAuthFnSession(authSession);
    await clientStorage.set(ClientStorageKey.USER_INFO, userInfo);
    this.postToEmbed({ token: sessionToken, userInfo });
    this.update(() => ({
      token: sessionToken,
      dataMode: UserDataMode.CLOUD,
      sessionType: params?.isNewUser
        ? UserSessionType.NEW
        : UserSessionType.RETURNING,
      userId: userInfo.id.split("user:")[1],
      userInfo
    }));

    logger.info({
      at: "account.signInFromAuthFnSession.ok",
      hasSessionToken: Boolean(sessionToken),
      isNewUser: params?.isNewUser,
      isPreventRedirect: params?.isPreventRedirect,
      userId: userInfo.id,
      region: userInfo.region,
      dataMode: UserDataMode.CLOUD,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : undefined
    });

    if (params?.isPreventRedirect) return true;
    this.gotoPostAuthRoute({ isNewUser: params?.isNewUser });
    return true;
  }

  private async resolveAuthFnSessionUserInfo(): Promise<{
    userInfo: UserInformation;
  } | null> {
    const { authClient } = await import("@nucleum/client/runtime/account/auth");
    const response = await (await authClient()).getSession();
    if (!response.ok || !response.data.session) {
      return null;
    }
    const session = response.data.session;
    return { userInfo: this.resolveUserInfoFromAuthFnSession(session) };
  }

  private resolveUserInfoFromAuthFnSession(session: any): UserInformation {
    const metadata = (session.metadata ?? {}) as {
      nucleus?: {
        isBootstrapped?: boolean;
        nickName?: string;
        profilePictureUrl?: string;
      };
    };
    const subject = session.subject ?? {};
    const email = session.primaryEmail ?? subject.email ?? "";
    const actorId = String(session.actorId ?? "");
    const id = actorId.startsWith("user:") ? actorId : `user:${actorId}`;
    return {
      id,
      email,
      nickName: metadata.nucleus?.nickName ?? email.split("@")[0] ?? "",
      joinDate: new Date(),
      lastLogin: new Date(),
      profilePictureUrl: metadata.nucleus?.profilePictureUrl,
      isBootstrapped: metadata.nucleus?.isBootstrapped ?? false,
      region: session.regionId ?? subject.regionId
    };
  }

  async delete() {
    confirmationNotification.notify({
      title: "Account deletion confirmation",
      message: "Are you sure you want to delete your account?",
      confirmAction: {
        label: "Delete",
        variant: ButtonVariant.DANGER,
        callback: async () => {
          return this.confirmDelete();
        }
      }
    });
  }

  async confirmDelete() {
    let isDeleted = false;
    try {
      dispatchCustomEvent(GlobalEvent.APP_LOADING_STATUS, {
        message: `Deleting account...`
      });
      const authFnDeleteStatus = await this.tryConfirmAuthFnDelete();
      if (authFnDeleteStatus === "failed") {
        return false;
      }
      if (authFnDeleteStatus === "deleted") {
        await this.completeConfirmedAccountDeletion();
        isDeleted = true;
        return true;
      }

      const result = await performApiCall(
        "v2/account/deleteAccount",
        "POST",
        {}
      );
      if (!result?.ok) {
        toasts.error("Failed to delete account. Please try again later.");
        return false;
      }
      const data = await result.json();
      if (data?.error) {
        toasts.error(data.error);
        return false;
      }
      await this.completeConfirmedAccountDeletion();
      isDeleted = true;
      return true;
    } catch (e) {
      logger.error({ at: "confirmDelete", error: e });
      toasts.error("Failed to delete account. Please try again later.");
      return false;
    } finally {
      dispatchCustomEvent(GlobalEvent.APP_LOADING_STATUS, {
        message: isDeleted ? `Account deleted.` : "Account deletion failed.",
        subMessage: "",
        isFinished: true
      });
    }
  }

  private async completeConfirmedAccountDeletion() {
    const cleanupOperations = [
      ["datafn", () => clearDatafnLocalData()],
      ["legacy", () => this.clearLegacyFluxLocalData()]
    ] as const;
    for (const [name, operation] of cleanupOperations) {
      try {
        await operation();
      } catch (error) {
        logger.error({ at: `account.delete.cleanup.${name}`, error });
      }
    }
    await this.signOut({ isPreventRedirect: true });
    appStore.gotoPath("/signup?msg=deleted");
  }

  private async clearLegacyFluxLocalData() {
    const account = this.get();
    const dapId = await clientStorage.get(ClientStorageKey.DAP_ID);
    const cleanupErrors: unknown[] = [];
    const identities = new Set(
      [account.userId, account.userInfo?.id, dapId]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.replace(/^user:/, ""))
    );
    const product = get(appStore).product;
    const databaseNames = new Set<string>();
    for (const identity of identities) {
      const prefix = `${identity}-1`;
      databaseNames.add(prefix);
    }
    const indexedDb = indexedDB as IDBFactory & {
      databases?: () => Promise<Array<{ name?: string }>>;
    };
    const listedDatabases =
      typeof indexedDb.databases === "function"
        ? await indexedDb.databases().catch(() => [])
        : [];
    for (const database of listedDatabases ?? []) {
      const databaseName = database.name;
      if (
        databaseName &&
        Array.from(identities).some((identity) => {
          const prefix = `${identity}-1-`;
          return (
            databaseName === `${identity}-1` ||
            (databaseName.startsWith(prefix) &&
              databaseName.endsWith("-search")) ||
            (databaseName.startsWith(`searchfn-${prefix}`) &&
              databaseName.endsWith("-search"))
          );
        })
      ) {
        databaseNames.add(databaseName);
      }
    }
    const deletionResults = await Promise.allSettled(
      Array.from(databaseNames, (name) => deleteIndexedDbDatabase(name))
    );
    cleanupErrors.push(
      ...deletionResults
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map((result) => result.reason)
    );
    try {
      await clearLegacySurrealLocalData(product, Array.from(identities));
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length) {
      throw new Error(
        cleanupErrors
          .map((error) =>
            error instanceof Error ? error.message : String(error)
          )
          .join("; ")
      );
    }
  }

  private async tryConfirmAuthFnDelete(): Promise<
    "deleted" | "not-authfn" | "failed"
  > {
    try {
      const { authClient } = await import("@nucleum/client/runtime/account/auth");
      const response = await (
        await authClient({
          isPreventCachedInstance: true
        })
      ).deleteAccount();
      if (response.ok) {
        return "deleted";
      }
      if (
        response.error.code === "AUTHFN_UNAUTHENTICATED" &&
        (await hasLegacyCloudSession())
      ) {
        return "not-authfn";
      }
      toasts.error(
        response.error.message ??
          "Failed to delete account. Please try again later."
      );
      return "failed";
    } catch (error) {
      logger.error({ at: "tryConfirmAuthFnDelete", error });
      if (await hasLegacyCloudSession()) {
        return "not-authfn";
      }
      toasts.error("Failed to delete account. Please try again later.");
      return "failed";
    }
  }

  async handlePlanStatus(plan: IUserPlan) {
    const isActive = determineIfPlanIsActive(plan);
    if (!isActive) {
      appStore.runAction(Action.INACTIVE_PLAN);
    }
    let expiry = determineIfSubscriptionExpired(plan);
    if (!expiry.isExpired) return;
    await this.modifySubscription({
      type: "sync"
    });
    plan = this.get()?.plan ?? plan;
    expiry = determineIfSubscriptionExpired(plan);
    if (!expiry.isExpired) return;
    if (!expiry.isWithinBuffer) {
      appStore.runAction(Action.INACTIVE_PLAN);
      // appStore.runAction(Action.EXPIRED_PLAN);
    }
  }

  async refreshPlanData() {
    try {
      const isOffline = await determineIfOffline();
      if (isOffline) return { status: "unavailable" as const };
      const response = await this.persistence.getUserPlan();
      if (response === undefined) {
        return { status: "unavailable" as const };
      }
      const data = Array.isArray(response)
        ? response[0]?.result?.[0]
        : response;
      if (data?.userPlan) {
        await clientStorage.set(ClientStorageKey.USER_PLAN, data.userPlan);
        this.update((n) => {
          n.plan = data.userPlan;
          return n;
        });
        return {
          status: "resolved" as const,
          plan: data.userPlan as IUserPlan
        };
      }
      await clientStorage.remove(ClientStorageKey.USER_PLAN);
      this.update((n) => ({ ...n, plan: undefined }));
      return { status: "resolved" as const, plan: undefined };
    } catch (e) {
      logger.error({ at: "refreshPlanData", error: e });
      return { status: "unavailable" as const, error: e };
    }
  }

  async initiateSubscription(params: any) {
    try {
      const isOffline = await determineIfOffline();
      if (isOffline) return;
      const response = await this.persistence.initiateSubscription(params);
      return response;
    } catch (e) {
      logger.error({ at: "initiateSubscription", error: e });
    }
  }

  async modifySubscription(params: any) {
    try {
      const isOffline = await determineIfOffline();
      if (isOffline) return;
      const response = await this.persistence.modifySubscription(params);
      if (response && response.userPlan) {
        this.update((n) => {
          n.plan = response.userPlan;
          return n;
        });
      }
      return response;
    } catch (e) {
      logger.error({ at: "modifySubscription", error: e });
    }
  }

  async restorePurchase() {
    try {
      const isOffline = await determineIfOffline();
      if (isOffline) return;
      const response = await this.persistence.restorePurchase();
      if (response && response.userPlan) {
        this.update((n) => {
          n.plan = response.userPlan;
          return n;
        });
      }
      return response;
    } catch (e) {
      logger.error({ at: "restorePurchase", error: e });
    }
  }
  async verifyPayment(nonce: string, embedTransaction?: any) {
    const response = await this.persistence.verifyPayment(
      nonce,
      embedTransaction
    );
    if (response && response.id) {
      const plan = response.userPlan ?? response;
      this.update((n) => {
        n.plan = plan;
        return n;
      });
      return { status: "success" };
    }
    return response;
  }

  async logGuest(id: string) {
    try {
      return this.persistence.runAccountAction("guest", { id });
    } catch (e) {
      logger.error({ at: "logGuest", error: e });
    }
  }

  async startOfflineSession() {
    this.update((n) => {
      n.token = undefined;
      n.userId = undefined;
      n.userInfo = undefined;
      n.dataMode = UserDataMode.LOCAL;
      n.sessionType = UserSessionType.RETURNING;
      return n;
    });
    await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
    await clientStorage.remove(ClientStorageKey.STOKEN);
    await clientStorage.remove(ClientStorageKey.USER);
    await clientStorage.remove(ClientStorageKey.USER_INFO);
    await this.ensureOfflineSession();
  }

  async ensureOfflineSession() {
    const existingSessionId = await clientStorage.get(
      ClientStorageKey.OFFLINE_SESSION_ID
    );
    if (existingSessionId) return existingSessionId;
    const sessionId = generateSimpleRandomId();
    await clientStorage.set(ClientStorageKey.OFFLINE_SESSION_ID, sessionId);
    return sessionId;
  }

  async bootstrap(region: string) {
    const authFnResult = await this.bootstrapAuthFn(region);
    if (authFnResult !== "not-authfn") {
      return authFnResult;
    }
    return this.bootstrapRemote(region);
  }

  private async bootstrapAuthFn(
    region: string
  ): Promise<boolean | "not-authfn"> {
    const result = await bootstrapNucleusAccount(region);
    if (result.kind === "not-authfn") {
      return "not-authfn";
    }
    if (result.kind === "failed") {
      logger.error({
        at: "account.bootstrapAuthFn.failed",
        status: result.status,
        error: result.error
      });
      return false;
    }

    await this.signInFromAuthFnSession({
      token: result.token,
      session: result.session,
      regionId: result.session.regionId ?? region,
      isNewUser: true,
      isPreventRedirect: true
    });
    this.gotoPostAuthRoute({ isNewUser: true });
    return true;
  }

  async bootstrapRemote(region: string) {
    const id = this.get()?.userInfo?.id?.split("user:")[1];
    if (!id) return;
    const response = await this.persistence.runAccountAction("bootstrap", {
      id,
      region
    });
    if (!response || response.error || !response.userInfo) {
      return false;
    }
    this.signIn(
      {
        userInfo: response.userInfo,
        token: response.token
      },
      {
        isNewUser: true
      }
    );
    return true;
  }

  getSignedUrl(contentType: string, fileName: string, isTemp: boolean) {
    const acc = get(account);
    const userId = acc.userInfo?.id.split(":")[1] ?? "";
    return this.persistence.getSignedUrl(userId, contentType, fileName, isTemp);
  }

  /**
   * @deprecated - use uploadFileV2 instead
   * @param contentType
   * @param fileName
   * @param blob
   * @param isTemp
   * @returns
   */
  async uploadFile(
    contentType: string,
    fileName: string,
    blob: any,
    isTemp: boolean = false
  ) {
    const signedUrlResponse = await this.getSignedUrl(
      contentType,
      fileName,
      isTemp
    );
    if (signedUrlResponse?.uploadURL) {
      await this.persistence.uploadFile(
        signedUrlResponse.uploadURL,
        contentType,
        blob
      );
      return signedUrlResponse;
    } else return null;
  }

  async uploadFileV2(
    contentType: string,
    fileName: string,
    blob: Blob,
    params: {
      isTemp?: boolean;
      isReturnUrl?: boolean;
      isExtensionEnv?: boolean;
      isPreventSync?: boolean;
      isMeta?: boolean;
      thumbnailBlob?: Blob;
      isGenerateThumbnail?: boolean;
    } = {}
  ) {
    try {
      const account = this.get();
      const id = generateResourceId(Resource.file, {
        id: contentType.split("/")[0] + "_" + generateSimpleRandomId()
      });
      logger.log({ at: "uploadFileV2", id, contentType, fileName });
      fileName = fileName
        .replace(/\s+/g, "_")
        .replace(/[()@#$%&*!?<>{}[\]\\\/\^~`+=;:,'"|]/g, "_");

      // Convert HEIC files to PNG
      const isHeicFile = fileName.toLowerCase().endsWith(".heic");
      if (isHeicFile) {
        try {
          const { convertedBlob, convertedFileName } =
            await convertHeicToPng(blob);
          blob = convertedBlob;
          contentType = "image/png";
          fileName = fileName.replace(/\.heic$/i, ".png");
          logger.log({
            at: "uploadFileV2",
            message: "Converted HEIC to PNG",
            originalFileName: fileName,
            newContentType: contentType
          });
        } catch (error) {
          logger.error({
            at: "uploadFileV2",
            error,
            message: "HEIC conversion failed"
          });
          throw new Error(
            "Failed to convert HEIC file. Please try a different format."
          );
        }
      }

      let thumbnailBlob: Blob | undefined = params.thumbnailBlob;
      if (params.isGenerateThumbnail && !thumbnailBlob) {
        if (contentType.includes("image")) {
          thumbnailBlob = await compressImageToTargetSize(blob);
        } else if (contentType.includes("pdf")) {
          const result = await generateImagePreviewFromPdf(blob);
          if (result) thumbnailBlob = result as Blob;
        }
      }
      if (account.dataMode === UserDataMode.LOCAL || params.isPreventSync) {
        return await this.saveLocalFile({
          id,
          fileName,
          contentType,
          blob,
          thumbnailBlob,
          isMeta: params.isMeta,
          isExtensionEnv: params.isExtensionEnv,
          isReturnUrl: params.isReturnUrl
        });
      } else {
        const signedUrlResponse = await this.getSignedUrl(
          contentType,
          fileName,
          params.isTemp ?? false
        );
        if (!signedUrlResponse || !signedUrlResponse.uploadURL) {
          return await this.saveLocalFile({
            id,
            fileName,
            contentType,
            blob,
            thumbnailBlob,
            isMeta: params.isMeta,
            isExtensionEnv: params.isExtensionEnv,
            isReturnUrl: params.isReturnUrl
          });
        }

        await this.persistence.uploadFile(
          signedUrlResponse.uploadURL,
          contentType,
          blob
        );
        // const url = signedUrlResponse.uploadURL.split("?")[0];
        const key = getBucketNameandKey(signedUrlResponse.uploadURL);
        const signedGetUrl = await this.persistence.fetchSignedUrlForGet(key);
        const url = signedGetUrl?.getUrl;
        let thumbnailUrl: string | undefined;
        if (thumbnailBlob) {
          const signedThumbnailUrlResponse = await this.getSignedUrl(
            "image/jpeg",
            "thumbnail_" + fileName,
            params.isTemp ?? false
          );
          const thumbnailUploadUrl = signedThumbnailUrlResponse?.uploadURL;
          if (thumbnailUploadUrl) {
            await this.persistence.uploadFile(
              thumbnailUploadUrl,
              "image/jpeg",
              thumbnailBlob
            );
            const thumbnailKey = getBucketNameandKey(thumbnailUploadUrl);
            const signedThumbnailGetUrl =
              await this.persistence.fetchSignedUrlForGet(thumbnailKey);
            thumbnailUrl = signedThumbnailGetUrl?.getUrl;
          }
        }
        const file = {
          id,
          label: fileName,
          type: contentType,
          url,
          size: blob.size,
          isMeta: params.isMeta,
          thumbnailUrl
        };
        if (params.isReturnUrl) {
          return url;
        } else if (params.isExtensionEnv) {
          return file;
        }
        const mutationResult = (await datafn.file.mutate({
          operation: "insert",
          id,
          record: file
        })) as { ok?: boolean; error?: unknown };
        if (mutationResult.ok === false) {
          throw mutationResult.error ?? new Error("File metadata save failed");
        }
        return [file];
      }
    } catch (e) {
      logger.error({ at: "uploadFileV2", error: e });
      throw e;
    }
  }

  private async saveLocalFile(params: {
    id: IRecordId;
    fileName: string;
    contentType: string;
    blob: Blob;
    thumbnailBlob?: Blob;
    isMeta?: boolean;
    isExtensionEnv?: boolean;
    isReturnUrl?: boolean;
  }) {
    if (params.isReturnUrl) {
      return URL.createObjectURL(params.blob);
    }
    const arrayBuffer = await params.blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let thumbnailUint8Array: Uint8Array | undefined;
    if (params.thumbnailBlob) {
      const thumbnailArrayBuffer = await params.thumbnailBlob.arrayBuffer();
      thumbnailUint8Array = new Uint8Array(thumbnailArrayBuffer);
    }
    const file = {
      id: params.id,
      label: params.fileName,
      name: params.fileName,
      type: params.contentType,
      data: uint8Array,
      size: uint8Array.length,
      isMeta: params.isMeta,
      thumbnailData: thumbnailUint8Array
    };
    if (params.isExtensionEnv) {
      return file;
    }
    const mutationResult = (await datafn.file.mutate({
      operation: "insert",
      id: params.id,
      record: file
    })) as { ok?: boolean; error?: unknown };
    if (mutationResult.ok === false) {
      throw mutationResult.error ?? new Error("File metadata save failed");
    }
    return [file];
  }

  /**
   * Used to upload a file to s3 temp bucket
   * @param input the file that needs to be uploaded to the S3 temp bucket
   */
  async tempUploadToS3(input: any) {
    let itemLocalURL = new Blob([input], { type: input.type });
    let customName = input.name.split(".")[0].replace(/\s+/g, "");
    const result = await this.uploadFile(
      input.type,
      customName,
      itemLocalURL,
      true
    );
    let url = result.uploadURL.split("?")[0];
    return [url, customName, itemLocalURL];
  }

  async checkIfSessionExpired() {
    const resolution = await resolveAuthSession();
    return !["authenticated", "offline-only", "cached-cloud"].includes(
      resolution.status
    );
  }

  isCloudUserAndOffline() {
    const account = this.get();
    const ctx = get(context);
    if (account.dataMode === UserDataMode.CLOUD && ctx.isInOfflineMode)
      return true;
    return false;
  }

  isCloudUserAndOnline() {
    const account = this.get();
    const ctx = get(context);
    if (account.dataMode === UserDataMode.CLOUD && !ctx.isInOfflineMode)
      return true;
    return false;
  }
}

const account = new AccountStore();
export default account;
