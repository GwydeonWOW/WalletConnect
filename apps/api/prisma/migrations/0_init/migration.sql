-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Ecosystem" AS ENUM ('evm', 'solana', 'sui');

-- CreateEnum
CREATE TYPE "WalletSource" AS ENUM ('zerion', 'solflare', 'suiet');

-- CreateEnum
CREATE TYPE "AddressStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'partial');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('coingecko', 'adapter', 'last_known_good', 'none');

-- CreateEnum
CREATE TYPE "FlowClass" AS ENUM ('external_contribution', 'external_withdrawal', 'internal_transfer', 'reward', 'airdrop', 'fee', 'unknown');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'es-ES',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasskeyCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT,
    "deviceType" TEXT,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ecosystem" "Ecosystem" NOT NULL,
    "walletSource" "WalletSource" NOT NULL,
    "chainRef" TEXT NOT NULL,
    "addressRaw" TEXT NOT NULL,
    "addressNormalized" TEXT NOT NULL,
    "label" TEXT,
    "status" "AddressStatus" NOT NULL DEFAULT 'active',
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSeenFromWallet" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "TrackedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "ecosystem" "Ecosystem" NOT NULL,
    "chainRef" TEXT NOT NULL,
    "contractRef" TEXT,
    "symbol" TEXT,
    "name" TEXT,
    "decimals" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrentPosition" (
    "id" TEXT NOT NULL,
    "trackedAddressId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "priceUsd" DECIMAL(38,18),
    "valueUsd" DECIMAL(38,18),
    "priceSource" "PriceSource" NOT NULL,
    "priceAsOf" TIMESTAMP(3),
    "valuationAsOf" TIMESTAMP(3) NOT NULL,
    "warnings" JSONB,

    CONSTRAINT "CurrentPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricePoint" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL DEFAULT 'USD',
    "source" "PriceSource" NOT NULL,
    "quotedAt" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "PricePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshotDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "bucketStartUtc" TIMESTAMP(3) NOT NULL,
    "bucketEndUtc" TIMESTAMP(3) NOT NULL,
    "quoteCurrency" TEXT NOT NULL DEFAULT 'USD',
    "netWorth" DECIMAL(38,18) NOT NULL,
    "unpricedValue" DECIMAL(38,18) NOT NULL,
    "externalContributions" DECIMAL(38,18) NOT NULL,
    "externalWithdrawals" DECIMAL(38,18) NOT NULL,
    "internalTransfers" DECIMAL(38,18) NOT NULL,
    "fees" DECIMAL(38,18) NOT NULL,
    "pnlNet" DECIMAL(38,18) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshotDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedAddressId" TEXT,
    "assetId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "txHash" TEXT,
    "externalId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(38,18),
    "amountUsd" DECIMAL(38,18),
    "feeUsd" DECIMAL(38,18),
    "counterparty" TEXT,
    "flowClass" "FlowClass" NOT NULL,
    "internalGroupKey" TEXT,
    "confidence" DECIMAL(5,4),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackedAddressId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "trigger" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyCredential_credentialId_key" ON "PasskeyCredential"("credentialId");

-- CreateIndex
CREATE INDEX "PasskeyCredential_userId_idx" ON "PasskeyCredential"("userId");

-- CreateIndex
CREATE INDEX "TrackedAddress_userId_status_idx" ON "TrackedAddress"("userId", "status");

-- CreateIndex
CREATE INDEX "TrackedAddress_ecosystem_chainRef_idx" ON "TrackedAddress"("ecosystem", "chainRef");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedAddress_userId_ecosystem_addressNormalized_key" ON "TrackedAddress"("userId", "ecosystem", "addressNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_canonicalKey_key" ON "Asset"("canonicalKey");

-- CreateIndex
CREATE INDEX "Asset_ecosystem_chainRef_idx" ON "Asset"("ecosystem", "chainRef");

-- CreateIndex
CREATE INDEX "Asset_symbol_idx" ON "Asset"("symbol");

-- CreateIndex
CREATE INDEX "CurrentPosition_trackedAddressId_idx" ON "CurrentPosition"("trackedAddressId");

-- CreateIndex
CREATE INDEX "CurrentPosition_assetId_idx" ON "CurrentPosition"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrentPosition_trackedAddressId_assetId_key" ON "CurrentPosition"("trackedAddressId", "assetId");

-- CreateIndex
CREATE INDEX "PricePoint_assetId_quotedAt_idx" ON "PricePoint"("assetId", "quotedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PricePoint_assetId_quoteCurrency_source_quotedAt_key" ON "PricePoint"("assetId", "quoteCurrency", "source", "quotedAt");

-- CreateIndex
CREATE INDEX "PortfolioSnapshotDaily_userId_day_idx" ON "PortfolioSnapshotDaily"("userId", "day" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSnapshotDaily_userId_day_quoteCurrency_key" ON "PortfolioSnapshotDaily"("userId", "day", "quoteCurrency");

-- CreateIndex
CREATE INDEX "FlowEvent_userId_occurredAt_idx" ON "FlowEvent"("userId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "FlowEvent_internalGroupKey_idx" ON "FlowEvent"("internalGroupKey");

-- CreateIndex
CREATE INDEX "FlowEvent_txHash_idx" ON "FlowEvent"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "FlowEvent_userId_externalId_key" ON "FlowEvent"("userId", "externalId");

-- CreateIndex
CREATE INDEX "SyncJob_status_createdAt_idx" ON "SyncJob"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SyncJob_userId_createdAt_idx" ON "SyncJob"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PasskeyCredential" ADD CONSTRAINT "PasskeyCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedAddress" ADD CONSTRAINT "TrackedAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentPosition" ADD CONSTRAINT "CurrentPosition_trackedAddressId_fkey" FOREIGN KEY ("trackedAddressId") REFERENCES "TrackedAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentPosition" ADD CONSTRAINT "CurrentPosition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricePoint" ADD CONSTRAINT "PricePoint_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSnapshotDaily" ADD CONSTRAINT "PortfolioSnapshotDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowEvent" ADD CONSTRAINT "FlowEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowEvent" ADD CONSTRAINT "FlowEvent_trackedAddressId_fkey" FOREIGN KEY ("trackedAddressId") REFERENCES "TrackedAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowEvent" ADD CONSTRAINT "FlowEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_trackedAddressId_fkey" FOREIGN KEY ("trackedAddressId") REFERENCES "TrackedAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
