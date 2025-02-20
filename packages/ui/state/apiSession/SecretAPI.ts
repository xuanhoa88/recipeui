"use secret";

import { useCallback, useEffect, useState } from "react";
import { eventEmitter, getSecretStore } from ".";
import { AuthConfig, SingleAuthConfig } from "types/database";
import { CollectionModule } from "types/modules";
import { ModuleSettings } from "../../modules/authConfigs";
import { RecipeAuthType } from "types/enums";
import { isCollectionModule } from "types/modules/helpers";

type SpecialKey = "client_secret" | "password";
export class SecretAPI {
  static getSecret = async ({
    secretId,
    index,
    specialKey,
  }: {
    secretId: string;
    index?: number;
    specialKey?: SpecialKey;
  }): Promise<string | undefined> => {
    if (typeof index === "number") {
      return (await this.getSecretArray({ secretId }))[index];
    }

    const store = await getSecretStore();
    return store.get(this.getKeyId(secretId, specialKey));
  };

  static getKeyId = (key: string, specialKey?: SpecialKey) => {
    return !specialKey ? key : `${key}::${specialKey}`;
  };

  static getSecretArray = async ({
    secretId,
  }: {
    secretId: string;
  }): Promise<string[]> => {
    const store = await getSecretStore();
    const secret = await store.get(secretId);
    try {
      const parsedSecret = JSON.parse(secret || "[]");
      return parsedSecret;
    } catch (e) {
      //
    }

    return [];
  };

  static saveSecret = async ({
    secretId,
    secretValue,
    specialKey,
  }: SaveSecret) => {
    const store = await getSecretStore();
    store.put(secretValue, this.getKeyId(secretId, specialKey));
  };

  static deleteSecret = async ({ secretId }: { secretId: string }) => {
    const store = await getSecretStore();
    const keys = await store.getAllKeys();

    for (const key of keys) {
      if (key.startsWith(secretId)) {
        await store.delete(key);
      }
    }
  };

  static getComplexSecrets = async ({
    collection,
  }: {
    collection: CollectionModule;
  }) => {
    let authConfigs: SingleAuthConfig[] = [];
    const initialConfig = ModuleSettings[collection]?.authConfig;

    if (initialConfig) {
      if (initialConfig.type === RecipeAuthType.Multiple) {
        authConfigs = initialConfig.payload;
      } else {
        authConfigs = [initialConfig];
      }
    }

    if (authConfigs.length === 0) {
      alert("No auth configs found for collection: " + collection);
      return {};
    }

    const secretRecord: Record<string, string | undefined> = {};

    let hasAuthSetup = true;

    await Promise.all(
      authConfigs.map(async (authConfig) => {
        const secretId = this.getSecretKeyFromConfig(authConfig, collection);
        secretRecord[secretId] = await this.getSecret({ secretId });

        if (!secretRecord[secretId]) hasAuthSetup = false;
      })
    );

    return { secretRecord, hasAuthSetup };
  };

  static getSecretKeyFromConfig(authConfig: SingleAuthConfig, prefix: string) {
    return `${prefix}::${authConfig.type}::${authConfig.payload?.name}`;
  }

  static _migrateSecrets = async ({
    authConfig,
    newId,
    oldId,
    singleConfig = true,
  }: {
    authConfig: AuthConfig;
    oldId: string;
    newId: string;
    singleConfig?: boolean;
  }) => {
    if (authConfig.type === RecipeAuthType.Multiple) {
      for (const config of authConfig.payload) {
        await this._migrateSecrets({
          authConfig: config,
          oldId,
          newId,
          singleConfig: false,
        });
      }
    } else {
      const secretKey = singleConfig
        ? oldId
        : this.getSecretKeyFromConfig(authConfig, oldId);

      const currentSecret = await this.getSecret({
        secretId: secretKey,
      });

      if (currentSecret) {
        await this.saveSecret({
          secretId: singleConfig
            ? newId
            : this.getSecretKeyFromConfig(authConfig, newId),
          secretValue: currentSecret,
        });

        await this.deleteSecret({
          secretId: secretKey,
        });
      }
    }
  };
}

interface SaveSecret {
  secretId: string;
  secretValue: string;
  specialKey?: SpecialKey;
}

interface ComplexSecretProps {
  collection?: string | CollectionModule;
  // eslint-disable-next-line no-unused-vars
  onSave?: (secrets: Record<string, string | undefined>) => void;
}
export function useComplexSecrets({ collection, onSave }: ComplexSecretProps) {
  const [secretRecord, setSecretRecord] = useState<
    Record<string, string | undefined>
  >({});
  const [hasAuthSetup, setHasAuthSetup] = useState<boolean>(false);

  useEffect(() => {
    async function refreshSecrets() {
      if (!collection || !isCollectionModule(collection)) {
        setSecretRecord({});
        setHasAuthSetup(false);
        return;
      }

      const response = await SecretAPI.getComplexSecrets({
        collection,
      });
      if (response.secretRecord) {
        setSecretRecord(response.secretRecord);
        setHasAuthSetup(response.hasAuthSetup);

        onSave?.(response.secretRecord);
      }
    }
    refreshSecrets();
    eventEmitter.on("refreshSecrets", refreshSecrets);

    return () => {
      eventEmitter.off("refreshSecrets", refreshSecrets);
    };

    // Do not add onSave to dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  const updateSecrets = useCallback(async (saveSecrets: SaveSecret[]) => {
    await Promise.all(
      saveSecrets.map(async (saveSecret) => {
        await SecretAPI.saveSecret(saveSecret);
      })
    );

    eventEmitter.emit("refreshSecrets");
  }, []);

  return {
    secretRecord,
    updateSecrets,
    hasAuthSetup,
  };
}
