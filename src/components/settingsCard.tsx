import React from "react";

type Props = {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
};

/**
 * A reusable card component for grouping settings items.
 *
 * @param title - The title of the card.
 * @param description - The description text of the card.
 * @param children - The content to display inside the card.
 * @param className - Additional class names for the container.
 */
export const SettingsCard = ({ title, description, children, className }: Props) => {
    return (
        <div className={`px-24 py-40 bg-surface1 rounded-16 shadow-sm border border-surface1-hover/50 ${className}`}>
            {title && <div className="typography-20 font-bold mb-8">{title}</div>}
            {description && <div className="typography-16 text-text2 mb-16">{description}</div>}
            <div>{children}</div>
        </div>
    );
};
