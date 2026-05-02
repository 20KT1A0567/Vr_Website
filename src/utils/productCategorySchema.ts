import type { Product } from "types";

type ProductComputedKey =
  | "processorSummary"
  | "memory"
  | "storage"
  | "display"
  | "operatingSystem"
  | "graphics"
  | "battery"
  | "weight"
  | "warranty"
  | "returns"
  | "condition"
  | "modelNumber";

type ProductFieldDefinition =
  | { key: ProductComputedKey; label: string; source: "computed" }
  | { key: string; label: string; source: "custom" };

export interface ProductSpecSection {
  title: string;
  fields: ProductFieldDefinition[];
}

export interface ProductCategoryDetailTemplate {
  key: string;
  label: string;
  intro: string;
  matches: string[];
  merchandisingPoints: string[];
  specSections: ProductSpecSection[];
}

function formatStorage(storageGb?: number, storageType?: string) {
  if (!storageGb) {
    return null;
  }

  const label = storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
  return `${label} ${storageType ?? ""}`.trim();
}

function baseFieldValue(product: Product, key: ProductComputedKey) {
  switch (key) {
    case "processorSummary":
      return product.processor
        ? `${product.processor}${product.processorGeneration ? ` / ${product.processorGeneration}` : ""}`
        : null;
    case "memory":
      return product.ramGb ? `${product.ramGb} GB RAM` : null;
    case "storage":
      return formatStorage(product.storageGb, product.storageType);
    case "display":
      return [product.displaySize, product.displayType].filter(Boolean).join(" / ") || null;
    case "operatingSystem":
      return product.os ?? null;
    case "graphics":
      return product.graphicsCard ?? null;
    case "battery":
      return product.battery ?? null;
    case "weight":
      return product.weight ?? null;
    case "warranty":
      return product.warrantyMonths ? `${product.warrantyMonths} months` : null;
    case "returns":
      return product.returnDays ? `${product.returnDays} day easy return` : null;
    case "condition":
      return product.productCondition ?? null;
    case "modelNumber":
      return product.modelNumber ?? null;
    default:
      return null;
  }
}

function customFieldValue(product: Product, key: string) {
  const value = product.customAttributes?.[key];

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const formatted = value.map((item) => String(item).trim()).filter(Boolean).join(", ");
    return formatted || null;
  }

  return null;
}

export function getFieldValue(product: Product, field: ProductFieldDefinition) {
  return field.source === "computed" ? baseFieldValue(product, field.key) : customFieldValue(product, field.key);
}

export function getVisibleSpecSections(product: Product, template: ProductCategoryDetailTemplate) {
  return template.specSections
    .map((section) => ({
      ...section,
      fields: section.fields
        .map((field) => ({ label: field.label, value: getFieldValue(product, field) }))
        .filter((field) => Boolean(field.value))
    }))
    .filter((section) => section.fields.length > 0);
}

const laptopTemplate: ProductCategoryDetailTemplate = {
  key: "laptop",
  label: "Laptop details",
  matches: ["laptop", "laptops", "gaming laptop", "gaming laptops"],
  intro: "Built for everyday work, classes, browsing, and reliable multitasking with store-backed peace of mind.",
  merchandisingPoints: [
    "Balanced portable performance for office work and study.",
    "Category-specific specs stay aligned with the selected laptop model.",
    "Warranty, return support, and store fulfillment show clearly on the page."
  ],
  specSections: [
    {
      title: "Core specifications",
      fields: [
        { source: "computed", key: "processorSummary", label: "Processor" },
        { source: "computed", key: "memory", label: "RAM" },
        { source: "computed", key: "storage", label: "Storage" },
        { source: "computed", key: "display", label: "Display" },
        { source: "computed", key: "operatingSystem", label: "Operating system" },
        { source: "computed", key: "graphics", label: "Graphics" }
      ]
    },
    {
      title: "Experience details",
      fields: [
        { source: "custom", key: "series", label: "Series" },
        { source: "custom", key: "screenResolution", label: "Screen resolution" },
        { source: "custom", key: "connectivity", label: "Connectivity" },
        { source: "custom", key: "webcam", label: "Webcam" },
        { source: "custom", key: "keyboardLayout", label: "Keyboard / input" },
        { source: "custom", key: "idealFor", label: "Ideal for" }
      ]
    },
    {
      title: "Package and coverage",
      fields: [
        { source: "computed", key: "battery", label: "Battery note" },
        { source: "computed", key: "weight", label: "Weight" },
        { source: "computed", key: "warranty", label: "Warranty" },
        { source: "computed", key: "returns", label: "Returns" },
        { source: "custom", key: "ports", label: "Ports" },
        { source: "custom", key: "boxContents", label: "What is in the box" }
      ]
    }
  ]
};

const macbookTemplate: ProductCategoryDetailTemplate = {
  ...laptopTemplate,
  key: "macbook",
  label: "MacBook details",
  matches: ["macbook", "macbooks"],
  intro: "Apple-focused refurbished hardware with battery, charger, and productivity details surfaced clearly for buyers.",
  specSections: [
    laptopTemplate.specSections[0],
    {
      title: "Apple-specific details",
      fields: [
        { source: "custom", key: "series", label: "Series" },
        { source: "custom", key: "screenResolution", label: "Screen resolution" },
        { source: "custom", key: "batteryCycles", label: "Battery cycle count" },
        { source: "custom", key: "chargerIncluded", label: "Charger included" },
        { source: "custom", key: "keyboardLayout", label: "Keyboard / input" },
        { source: "custom", key: "idealFor", label: "Ideal for" }
      ]
    },
    {
      title: "Package and coverage",
      fields: [
        { source: "computed", key: "battery", label: "Battery note" },
        { source: "computed", key: "weight", label: "Weight" },
        { source: "computed", key: "warranty", label: "Warranty" },
        { source: "computed", key: "returns", label: "Returns" },
        { source: "custom", key: "ports", label: "Ports" },
        { source: "custom", key: "boxContents", label: "What is in the box" }
      ]
    }
  ]
};

const desktopTemplate: ProductCategoryDetailTemplate = {
  key: "desktop",
  label: "Desktop details",
  matches: ["desktop", "desktops"],
  intro: "Desktop buyers usually care about the tower setup, ports, upgradability, and what is included with the CPU.",
  merchandisingPoints: [
    "Form factor, RAM expansion, and port layout are easier to compare.",
    "Office and lab-friendly details can be managed directly from admin.",
    "Package contents and support notes stay visible to the customer."
  ],
  specSections: [
    {
      title: "Core hardware",
      fields: [
        { source: "computed", key: "processorSummary", label: "Processor" },
        { source: "computed", key: "memory", label: "RAM" },
        { source: "computed", key: "storage", label: "Storage" },
        { source: "computed", key: "operatingSystem", label: "Operating system" },
        { source: "computed", key: "graphics", label: "Graphics" },
        { source: "custom", key: "formFactor", label: "Form factor" }
      ]
    },
    {
      title: "Setup and expansion",
      fields: [
        { source: "custom", key: "series", label: "Series" },
        { source: "custom", key: "ramType", label: "RAM type / expansion" },
        { source: "custom", key: "ports", label: "Ports / slots" },
        { source: "custom", key: "connectivity", label: "Connectivity" },
        { source: "custom", key: "opticalDrive", label: "Optical drive" },
        { source: "custom", key: "audio", label: "Audio" }
      ]
    },
    {
      title: "Coverage and packaging",
      fields: [
        { source: "computed", key: "warranty", label: "Warranty" },
        { source: "computed", key: "returns", label: "Returns" },
        { source: "computed", key: "weight", label: "Weight" },
        { source: "custom", key: "boxContents", label: "What is in the box" },
        { source: "custom", key: "idealFor", label: "Ideal for" }
      ]
    }
  ]
};

const workstationTemplate: ProductCategoryDetailTemplate = {
  ...desktopTemplate,
  key: "workstation",
  label: "Workstation details",
  matches: ["workstation", "workstations"],
  intro: "Professional workstation listings should bring out graphics power, workflow fit, and expansion clarity.",
  specSections: [
    desktopTemplate.specSections[0],
    {
      title: "Professional workflow details",
      fields: [
        { source: "custom", key: "series", label: "Series" },
        { source: "custom", key: "ramType", label: "RAM type / expansion" },
        { source: "custom", key: "graphicsMemory", label: "Graphics memory" },
        { source: "custom", key: "certification", label: "Workflow note" },
        { source: "custom", key: "ports", label: "Ports / slots" },
        { source: "custom", key: "connectivity", label: "Connectivity" }
      ]
    },
    desktopTemplate.specSections[2]
  ]
};

const monitorTemplate: ProductCategoryDetailTemplate = {
  key: "monitor",
  label: "Monitor details",
  matches: ["monitor", "monitors"],
  intro: "Monitor pages should emphasize the panel, refresh behavior, connectivity, and desk setup features instead of laptop hardware.",
  merchandisingPoints: [
    "Display-focused specifications are grouped the way buyers compare monitors.",
    "Refresh rate, stand features, and mount support stay front and center.",
    "Ports and included accessories are easier to understand before purchase."
  ],
  specSections: [
    {
      title: "Display details",
      fields: [
        { source: "computed", key: "display", label: "Display" },
        { source: "custom", key: "resolution", label: "Resolution" },
        { source: "custom", key: "panelType", label: "Panel type" },
        { source: "custom", key: "refreshRate", label: "Refresh rate" },
        { source: "custom", key: "responseTime", label: "Response time" },
        { source: "custom", key: "brightness", label: "Brightness" }
      ]
    },
    {
      title: "Desk setup",
      fields: [
        { source: "custom", key: "ports", label: "Ports" },
        { source: "custom", key: "standFeatures", label: "Stand features" },
        { source: "custom", key: "mountSupport", label: "Mount support" },
        { source: "computed", key: "weight", label: "Weight" },
        { source: "custom", key: "boxContents", label: "What is in the box" }
      ]
    },
    {
      title: "Coverage",
      fields: [
        { source: "computed", key: "warranty", label: "Warranty" },
        { source: "computed", key: "returns", label: "Returns" }
      ]
    }
  ]
};

const accessoryTemplate: ProductCategoryDetailTemplate = {
  key: "accessory",
  label: "Accessory details",
  matches: ["accessory", "accessories"],
  intro: "Accessory pages should focus on compatibility, connectivity, finish, and exactly what arrives in the box.",
  merchandisingPoints: [
    "Peripheral buyers see fit, connectivity, and use-case details more clearly.",
    "The admin panel can now describe accessories without irrelevant laptop fields.",
    "Package details and compatibility stay visible across the storefront."
  ],
  specSections: [
    {
      title: "Accessory snapshot",
      fields: [
        { source: "custom", key: "accessoryType", label: "Accessory type" },
        { source: "custom", key: "compatibility", label: "Compatibility" },
        { source: "custom", key: "connectivity", label: "Connectivity" },
        { source: "custom", key: "color", label: "Color / finish" },
        { source: "custom", key: "material", label: "Material / build" },
        { source: "custom", key: "dimensions", label: "Dimensions / weight" }
      ]
    },
    {
      title: "Usage and package",
      fields: [
        { source: "custom", key: "powerRequirement", label: "Power / battery" },
        { source: "custom", key: "idealFor", label: "Ideal for" },
        { source: "custom", key: "boxContents", label: "What is in the box" },
        { source: "computed", key: "warranty", label: "Warranty" },
        { source: "computed", key: "returns", label: "Returns" }
      ]
    }
  ]
};

const genericTemplate: ProductCategoryDetailTemplate = {
  key: "generic",
  label: "Product details",
  matches: [],
  intro: "Core specifications, packaging, and support notes are structured so the product page stays useful even for uncategorized product types.",
  merchandisingPoints: [
    "Shared catalog fields still render in a clean, buyer-friendly structure.",
    "Admin-entered extra notes automatically appear in the right detail blocks.",
    "Store-backed warranty and return information remain visible on every product."
  ],
  specSections: [
    {
      title: "Specifications",
      fields: [
        { source: "computed", key: "processorSummary", label: "Processor" },
        { source: "computed", key: "memory", label: "RAM" },
        { source: "computed", key: "storage", label: "Storage" },
        { source: "computed", key: "display", label: "Display" },
        { source: "computed", key: "operatingSystem", label: "Operating system" },
        { source: "computed", key: "graphics", label: "Graphics" }
      ]
    },
    {
      title: "Additional details",
      fields: [
        { source: "computed", key: "battery", label: "Battery note" },
        { source: "computed", key: "weight", label: "Weight" },
        { source: "custom", key: "ports", label: "Ports" },
        { source: "custom", key: "idealFor", label: "Ideal for" },
        { source: "custom", key: "boxContents", label: "What is in the box" },
        { source: "computed", key: "warranty", label: "Warranty" },
        { source: "computed", key: "returns", label: "Returns" }
      ]
    }
  ]
};

const productCategoryTemplates: ProductCategoryDetailTemplate[] = [
  laptopTemplate,
  macbookTemplate,
  desktopTemplate,
  workstationTemplate,
  monitorTemplate,
  accessoryTemplate,
  genericTemplate
];

export function resolveProductCategoryDetailTemplate(categoryName?: string) {
  const normalized = categoryName?.trim().toLowerCase() ?? "";
  return (
    productCategoryTemplates.find((template) => template !== genericTemplate && template.matches.some((match) => normalized.includes(match))) ??
    genericTemplate
  );
}
