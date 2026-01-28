-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECH', 'SALES', 'ACCOUNTS');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('PREPAY', 'EOM', '30_DAYS');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'STALE', 'PARTIALLY_FULFILLED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "ClientDecision" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('TO_OFFICE', 'DIRECT_TO_END_USER', 'DIRECT_TO_SITE');

-- CreateEnum
CREATE TYPE "QuoteItemStatus" AS ENUM ('QUOTED', 'ORDER_PENDING', 'ORDERED', 'RECEIVED_OFFICE', 'DELIVERED_DIRECT', 'DISPATCHED', 'INSTALLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierOrderStatus" AS ENUM ('PENDING', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('NOT_CREATED', 'CREATED', 'SENT', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentRequired" AS ENUM ('PREPAY_REQUIRED', 'PRIVILEGED_ALLOWED');

-- CreateEnum
CREATE TYPE "DispatchDestination" AS ENUM ('INSTALLATION', 'DELIVERY');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TECH',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingEmail" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "isPrivileged" BOOLEAN NOT NULL DEFAULT false,
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'PREPAY',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "defaultLeadDays" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "assignedSalesUserId" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3),
    "clientContactName" TEXT,
    "clientContactEmail" TEXT,
    "clientDecision" "ClientDecision" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vat" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),
    "reminder24SentAt" TIMESTAMP(3),
    "reminder72SentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sellPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "marginPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplierId" TEXT,
    "etaDate" TIMESTAMP(3),
    "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'TO_OFFICE',
    "deliveryContactName" TEXT,
    "deliveryContactPhone" TEXT,
    "deliveryAddressOverride" TEXT,
    "assignedTechnicianUserId" TEXT,
    "itemStatus" "QuoteItemStatus" NOT NULL DEFAULT 'QUOTED',
    "serialNumber" TEXT,
    "warrantyExpiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierOrder" (
    "id" TEXT NOT NULL,
    "supplierOrderNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "status" "SupplierOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderedAt" TIMESTAMP(3),
    "expectedEtaDate" TIMESTAMP(3),
    "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'TO_OFFICE',
    "deliveryAddress" TEXT,
    "deliveryContactName" TEXT,
    "deliveryContactPhone" TEXT,
    "supplierReference" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierOrderItem" (
    "id" TEXT NOT NULL,
    "supplierOrderId" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "SupplierOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'NOT_CREATED',
    "paymentRequired" "PaymentRequired" NOT NULL DEFAULT 'PREPAY_REQUIRED',
    "markedPaidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "supplierOrderId" TEXT NOT NULL,
    "receivedByUserId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentRef" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "qtyReceived" INTEGER NOT NULL,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "dispatchNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "dispatchedByUserId" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination" "DispatchDestination" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchItem" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "qtyDispatched" INTEGER NOT NULL,

    CONSTRAINT "DispatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAccessToken" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequence" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOrder_supplierOrderNumber_key" ON "SupplierOrder"("supplierOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_grnNumber_key" ON "GoodsReceipt"("grnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_dispatchNumber_key" ON "Dispatch"("dispatchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteAccessToken_token_key" ON "QuoteAccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Sequence_key_key" ON "Sequence"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_assignedSalesUserId_fkey" FOREIGN KEY ("assignedSalesUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_assignedTechnicianUserId_fkey" FOREIGN KEY ("assignedTechnicianUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOrderItem" ADD CONSTRAINT "SupplierOrderItem_supplierOrderId_fkey" FOREIGN KEY ("supplierOrderId") REFERENCES "SupplierOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierOrderItem" ADD CONSTRAINT "SupplierOrderItem_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_supplierOrderId_fkey" FOREIGN KEY ("supplierOrderId") REFERENCES "SupplierOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_dispatchedByUserId_fkey" FOREIGN KEY ("dispatchedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAccessToken" ADD CONSTRAINT "QuoteAccessToken_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
