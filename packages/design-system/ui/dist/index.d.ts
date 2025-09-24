import * as React$1 from 'react';
import React__default, { ElementType, Ref, KeyboardEventHandler, ReactNode, FC, MutableRefObject } from 'react';
import { ICustomSearchSelectOption, EProductSubscriptionEnum } from '@unified-teamspace/types';
import { DayPicker } from 'react-day-picker';
import * as lucide_react from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { Placement as Placement$1 } from '@popperjs/core';
import { Placement } from '@blueprintjs/popover2';
import * as _headlessui_react from '@headlessui/react';
import { EmojiClickData, Theme } from 'emoji-picker-react';
import { EIconSize, E_PASSWORD_STRENGTH } from '@unified-teamspace/constants';
import { ClassValue } from 'clsx';

type TAvatarSize = "sm" | "md" | "base" | "lg" | number;
type Props$g = {
    /**
     * The name of the avatar which will be displayed on the tooltip
     */
    name?: string;
    /**
     * The background color if the avatar image fails to load
     */
    fallbackBackgroundColor?: string;
    /**
     * The text to display if the avatar image fails to load
     */
    fallbackText?: string;
    /**
     * The text color if the avatar image fails to load
     */
    fallbackTextColor?: string;
    /**
     * Whether to show the tooltip or not
     * @default true
     */
    showTooltip?: boolean;
    /**
     * The size of the avatars
     * Possible values: "sm", "md", "base", "lg"
     * @default "md"
     */
    size?: TAvatarSize;
    /**
     * The shape of the avatar
     * Possible values: "circle", "square"
     * @default "circle"
     */
    shape?: "circle" | "square";
    /**
     * The source of the avatar image
     */
    src?: string;
    /**
     * The custom CSS class name to apply to the component
     */
    className?: string;
};
/**
 * Get the size details based on the size prop
 * @param size The size of the avatar
 * @returns The size details
 */
declare const getSizeInfo: (size: TAvatarSize) => {
    avatarSize: string;
    fontSize: string;
    spacing: string;
};
/**
 * Get the border radius based on the shape prop
 * @param shape The shape of the avatar
 * @returns The border radius
 */
declare const getBorderRadius: (shape: "circle" | "square") => "rounded-full" | "rounded";
/**
 * Check if the value is a valid number
 * @param value The value to check
 * @returns Whether the value is a valid number or not
 */
declare const isAValidNumber: (value: any) => boolean;
declare const Avatar: React__default.FC<Props$g>;

type Props$f = {
    /**
     * The children of the avatar group.
     * These should ideally should be `Avatar` components
     */
    children: React__default.ReactNode;
    /**
     * The maximum number of avatars to display.
     * If the number of children exceeds this value, the additional avatars will be replaced by a count of the remaining avatars.
     * @default 2
     */
    max?: number;
    /**
     * Whether to show the tooltip or not
     * @default true
     */
    showTooltip?: boolean;
    /**
     * The size of the avatars
     * Possible values: "sm", "md", "base", "lg"
     * @default "md"
     */
    size?: TAvatarSize;
};
declare const AvatarGroup: React__default.FC<Props$f>;

type TBadgeVariant = "primary" | "accent-primary" | "outline-primary" | "neutral" | "accent-neutral" | "outline-neutral" | "success" | "accent-success" | "outline-success" | "warning" | "accent-warning" | "outline-warning" | "destructive" | "accent-destructive" | "outline-destructive";
type TBadgeSizes = "sm" | "md" | "lg" | "xl";

interface BadgeProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: TBadgeVariant;
    size?: TBadgeSizes;
    className?: string;
    loading?: boolean;
    disabled?: boolean;
    appendIcon?: any;
    prependIcon?: any;
    children: React$1.ReactNode;
}
declare const Badge: React$1.ForwardRefExoticComponent<BadgeProps & React$1.RefAttributes<HTMLButtonElement>>;

type BreadcrumbsProps = {
    className?: string;
    children: React$1.ReactNode;
    onBack?: () => void;
    isLoading?: boolean;
};
declare const BreadcrumbItemLoader: () => React$1.JSX.Element;
declare const Breadcrumbs: {
    ({ className, children, onBack, isLoading }: BreadcrumbsProps): React$1.JSX.Element;
    Item: React$1.FC<BreadcrumbItemProps>;
    Icon: React$1.FC<BreadcrumbIconProps>;
    Label: React$1.FC<BreadcrumbLabelProps>;
    Separator: React$1.FC<BreadcrumbSeparatorProps>;
    ItemWrapper: React$1.FC<BreadcrumbItemWrapperProps>;
};
type BreadcrumbItemProps = {
    component?: React$1.ReactNode;
    showSeparator?: boolean;
    isLast?: boolean;
};
declare const BreadcrumbItem: React$1.FC<BreadcrumbItemProps>;
type BreadcrumbIconProps = {
    children: React$1.ReactNode;
    className?: string;
};
declare const BreadcrumbIcon: React$1.FC<BreadcrumbIconProps>;
type BreadcrumbLabelProps = {
    children: React$1.ReactNode;
    className?: string;
};
declare const BreadcrumbLabel: React$1.FC<BreadcrumbLabelProps>;
type BreadcrumbSeparatorProps = {
    className?: string;
    containerClassName?: string;
    iconClassName?: string;
    showDivider?: boolean;
};
declare const BreadcrumbSeparator: React$1.FC<BreadcrumbSeparatorProps>;
type BreadcrumbItemWrapperProps = {
    label?: string;
    disableTooltip?: boolean;
    children: React$1.ReactNode;
    className?: string;
    type?: "link" | "text";
    isLast?: boolean;
};
declare const BreadcrumbItemWrapper: React$1.FC<BreadcrumbItemWrapperProps>;

type TContextMenuItem = {
    key: string;
    customContent?: React__default.ReactNode;
    title?: string;
    description?: string;
    icon?: React__default.FC<any>;
    action: () => void;
    shouldRender?: boolean;
    closeOnClick?: boolean;
    disabled?: boolean;
    className?: string;
    iconClassName?: string;
    nestedMenuItems?: TContextMenuItem[];
};
interface PortalProps$1 {
    children: React__default.ReactNode;
    container?: Element | null;
}
declare const Portal: React__default.FC<PortalProps$1>;
declare const ContextMenuContext: React__default.Context<{
    closeAllSubmenus: () => void;
    registerSubmenu: (closeSubmenu: () => void) => () => void;
    portalContainer?: Element | null;
} | null>;
type ContextMenuProps = {
    parentRef: React__default.RefObject<HTMLElement>;
    items: TContextMenuItem[];
    portalContainer?: Element | null;
};
declare const ContextMenu: React__default.FC<ContextMenuProps>;

type ContextMenuItemProps = {
    handleActiveItem: () => void;
    handleClose: () => void;
    isActive: boolean;
    item: TContextMenuItem;
};
declare const ContextMenuItem: React__default.FC<ContextMenuItemProps>;

interface IDropdownProps {
    customButtonClassName?: string;
    customButtonTabIndex?: number;
    buttonClassName?: string;
    className?: string;
    customButton?: React.ReactNode;
    disabled?: boolean;
    input?: boolean;
    label?: string | React.ReactNode;
    maxHeight?: "sm" | "rg" | "md" | "lg";
    noChevron?: boolean;
    chevronClassName?: string;
    onOpen?: () => void;
    optionsClassName?: string;
    placement?: Placement;
    tabIndex?: number;
    useCaptureForOutsideClick?: boolean;
    defaultOpen?: boolean;
}
interface ICustomMenuDropdownProps extends IDropdownProps {
    children: React.ReactNode;
    ellipsis?: boolean;
    noBorder?: boolean;
    verticalEllipsis?: boolean;
    menuButtonOnClick?: (...args: any) => void;
    menuItemsClassName?: string;
    onMenuClose?: () => void;
    closeOnSelect?: boolean;
    portalElement?: Element | null;
    openOnHover?: boolean;
    ariaLabel?: string;
}
interface ICustomSelectProps extends IDropdownProps {
    children: React.ReactNode;
    value: any;
    onChange: any;
}
interface CustomSearchSelectProps {
    footerOption?: React.ReactNode;
    onChange: any;
    onClose?: () => void;
    noResultsMessage?: string;
    options?: ICustomSearchSelectOption[];
}
interface SingleValueProps {
    multiple?: false;
    value: any;
}
interface MultipleValuesProps {
    multiple?: true;
    value: any[] | null;
}
type ICustomSearchSelectProps = IDropdownProps & CustomSearchSelectProps & (SingleValueProps | MultipleValuesProps);
interface ICustomMenuItemProps {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: (args?: any) => void;
    className?: string;
}
interface ICustomSelectItemProps {
    children: React.ReactNode;
    value: any;
    className?: string;
}
interface ICustomSubMenuProps {
    children: React.ReactNode;
    trigger: React.ReactNode;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
    placement?: Placement;
}
interface ICustomSubMenuTriggerProps {
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}
interface ICustomSubMenuContentProps {
    children: React.ReactNode;
    className?: string;
    placement?: Placement;
    sideOffset?: number;
    alignOffset?: number;
}

interface PortalProps {
    children: React$1.ReactNode;
    container?: Element | null;
    asChild?: boolean;
}
declare const CustomMenu: {
    (props: ICustomMenuDropdownProps): React$1.JSX.Element;
    Portal: React$1.FC<PortalProps>;
    MenuItem: React$1.FC<ICustomMenuItemProps>;
    SubMenu: React$1.FC<ICustomSubMenuProps>;
    SubMenuTrigger: React$1.FC<ICustomSubMenuTriggerProps>;
    SubMenuContent: React$1.FC<ICustomSubMenuContentProps>;
};

declare const CustomSelect: {
    (props: ICustomSelectProps): React__default.JSX.Element;
    Option: (props: ICustomSelectItemProps) => React__default.JSX.Element;
};

declare const CustomSearchSelect: (props: ICustomSearchSelectProps) => React__default.JSX.Element;

type Props$e = {
    as?: ElementType | undefined;
    ref?: Ref<HTMLElement> | undefined;
    tabIndex?: number | undefined;
    className?: string | undefined;
    value?: string | string[] | null;
    onChange?: (value: any) => void;
    disabled?: boolean | undefined;
    onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined;
    multiple?: boolean;
    renderByDefault?: boolean;
    button: ReactNode;
    children: ReactNode;
};
declare const ComboDropDown: React__default.ForwardRefExoticComponent<Omit<Props$e, "ref"> & React__default.RefAttributes<unknown>>;
declare const ComboOptions: _headlessui_react._internal_ComponentComboboxOptions;
declare const ComboOption: _headlessui_react._internal_ComponentComboboxOption;
declare const ComboInput: _headlessui_react._internal_ComponentComboboxInput;

type TBreadcrumbNavigationDropdownProps = {
    selectedItemKey: string;
    navigationItems: TContextMenuItem[];
    navigationDisabled?: boolean;
    handleOnClick?: () => void;
    isLast?: boolean;
};
declare const BreadcrumbNavigationDropdown: (props: TBreadcrumbNavigationDropdownProps) => React$1.JSX.Element | null;

type TBreadcrumbNavigationSearchDropdownProps = {
    icon?: React$1.ReactNode;
    title?: string;
    selectedItem: string;
    navigationItems: ICustomSearchSelectOption[];
    onChange?: (value: string) => void;
    navigationDisabled?: boolean;
    isLast?: boolean;
    handleOnClick?: () => void;
    disableRootHover?: boolean;
    shouldTruncate?: boolean;
};
declare const BreadcrumbNavigationSearchDropdown: React$1.FC<TBreadcrumbNavigationSearchDropdownProps>;

type TButtonVariant = "primary" | "accent-primary" | "outline-primary" | "neutral-primary" | "link-primary" | "danger" | "accent-danger" | "outline-danger" | "link-danger" | "tertiary-danger" | "link-neutral";
type TButtonSizes = "sm" | "md" | "lg" | "xl";
interface IButtonStyling {
    [key: string]: {
        default: string;
        hover: string;
        pressed: string;
        disabled: string;
    };
}
declare const buttonStyling: IButtonStyling;
declare const getButtonStyling: (variant: TButtonVariant, size: TButtonSizes, disabled?: boolean) => string;
declare const getIconStyling: (size: TButtonSizes) => string;

interface ButtonProps extends React$1.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: TButtonVariant;
    size?: TButtonSizes;
    className?: string;
    loading?: boolean;
    disabled?: boolean;
    appendIcon?: any;
    prependIcon?: any;
    children: React$1.ReactNode;
}
declare const Button: React$1.ForwardRefExoticComponent<ButtonProps & React$1.RefAttributes<HTMLButtonElement>>;

interface IToggleSwitchProps {
    value: boolean;
    onChange: (value: boolean) => void;
    label?: string;
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    className?: string;
}
declare const ToggleSwitch: React$1.FC<IToggleSwitchProps>;

type CalendarProps = React$1.ComponentProps<typeof DayPicker>;
declare const Calendar: ({ className, classNames, showOutsideDays, ...props }: CalendarProps) => React$1.JSX.Element;

declare enum ECardVariant {
    WITHOUT_SHADOW = "without-shadow",
    WITH_SHADOW = "with-shadow"
}
declare enum ECardDirection {
    ROW = "row",
    COLUMN = "column"
}
declare enum ECardSpacing {
    SM = "sm",
    LG = "lg"
}
type TCardVariant = ECardVariant.WITHOUT_SHADOW | ECardVariant.WITH_SHADOW;
type TCardDirection = ECardDirection.ROW | ECardDirection.COLUMN;
type TCardSpacing = ECardSpacing.SM | ECardSpacing.LG;

interface CardProps {
    variant?: TCardVariant;
    spacing?: TCardSpacing;
    direction?: TCardDirection;
    className?: string;
    children: React$1.ReactNode;
}
declare const Card: React$1.ForwardRefExoticComponent<CardProps & React$1.RefAttributes<HTMLDivElement>>;

type TCollapsibleProps = {
    title: string | React__default.ReactNode;
    children: React__default.ReactNode;
    buttonRef?: React__default.RefObject<HTMLButtonElement>;
    className?: string;
    buttonClassName?: string;
    isOpen?: boolean;
    onToggle?: () => void;
    defaultOpen?: boolean;
};
declare const Collapsible: FC<TCollapsibleProps>;

interface ISvgIcons extends React.SVGAttributes<SVGElement> {
    className?: string | undefined;
    percentage?: number;
}

declare const DoubleCircleIcon: React$1.FC<ISvgIcons>;

declare const CircleDotFullIcon: React$1.FC<ISvgIcons>;

declare const ContrastIcon: React$1.FC<ISvgIcons>;

interface ICycleGroupIcon {
    className?: string;
    color?: string;
    cycleGroup: TCycleGroups;
    height?: string;
    width?: string;
}
type TCycleGroups = "current" | "upcoming" | "completed" | "draft";
declare const CYCLE_GROUP_COLORS: {
    [key in TCycleGroups]: string;
};
declare const CYCLE_GROUP_I18N_LABELS: {
    [key in TCycleGroups]: string;
};

declare const CycleGroupIcon: React$1.FC<ICycleGroupIcon>;

declare const ModuleBacklogIcon: React$1.FC<ISvgIcons>;

declare const ModuleCancelledIcon: React$1.FC<ISvgIcons>;

declare const ModuleCompletedIcon: React$1.FC<ISvgIcons>;

declare const ModuleInProgressIcon: React$1.FC<ISvgIcons>;

type TModuleStatus = "backlog" | "planned" | "in-progress" | "paused" | "completed" | "cancelled";
type Props$d = {
    status: TModuleStatus;
    className?: string;
    height?: string;
    width?: string;
};
declare const ModuleStatusIcon: React$1.FC<Props$d>;

declare const ModulePausedIcon: React$1.FC<ISvgIcons>;

declare const ModulePlannedIcon: React$1.FC<ISvgIcons>;

declare const BacklogGroupIcon: React$1.FC<ISvgIcons>;

declare const CancelledGroupIcon: React$1.FC<ISvgIcons>;

declare const CompletedGroupIcon: React$1.FC<ISvgIcons>;

declare const StartedGroupIcon: React$1.FC<ISvgIcons>;

interface IStateGroupIcon {
    className?: string;
    color?: string;
    stateGroup: TStateGroups;
    size?: EIconSize;
    percentage?: number;
}
type TStateGroups = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

declare const StateGroupIcon: React$1.FC<IStateGroupIcon>;

declare const UnstartedGroupIcon: React$1.FC<ISvgIcons>;

declare const ArchiveIcon: React$1.FC<ISvgIcons>;

declare const BlockedIcon: React$1.FC<ISvgIcons>;

declare const BlockerIcon: React$1.FC<ISvgIcons>;

declare const CalendarAfterIcon: React$1.FC<ISvgIcons>;

declare const CalendarBeforeIcon: React$1.FC<ISvgIcons>;

declare const CenterPanelIcon: React$1.FC<ISvgIcons>;

declare const CommentFillIcon: React$1.FC<ISvgIcons>;

declare const CreateIcon: React$1.FC<ISvgIcons>;

declare const DiceIcon: React$1.FC<ISvgIcons>;

declare const DiscordIcon: React$1.FC<ISvgIcons>;

type Props$c = {
    className?: string;
    width?: string | number;
    height?: string | number;
    color?: string;
};
declare const EpicIcon: React$1.FC<Props$c>;

declare const FullScreenPanelIcon: React$1.FC<ISvgIcons>;

declare const GithubIcon: React$1.FC<ISvgIcons>;

declare const GitlabIcon: React$1.FC<ISvgIcons>;

declare const InfoFillIcon: React$1.FC<ISvgIcons>;

declare const InfoIcon: React$1.FC<ISvgIcons>;

declare const LayerStackIcon: React$1.FC<ISvgIcons>;

declare const LayersIcon: React$1.FC<ISvgIcons>;

declare const MonospaceIcon: React$1.FC<ISvgIcons>;

declare const PhotoFilterIcon: React$1.FC<ISvgIcons>;

type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";
interface IPriorityIcon {
    className?: string;
    containerClassName?: string;
    priority: TIssuePriorities | undefined | null;
    size?: number;
    withContainer?: boolean;
}
declare const PriorityIcon: React$1.FC<IPriorityIcon>;

declare const RelatedIcon: React$1.FC<ISvgIcons>;

declare const SansSerifIcon: React$1.FC<ISvgIcons>;

declare const SerifIcon: React$1.FC<ISvgIcons>;

declare const SidePanelIcon: React$1.FC<ISvgIcons>;

declare const TransferIcon: React$1.FC<ISvgIcons>;

declare const DropdownIcon: React$1.FC<ISvgIcons>;

declare const Intake: React$1.FC<ISvgIcons>;

declare const UserActivityIcon: React$1.FC<ISvgIcons>;

declare const FavoriteFolderIcon: React$1.FC<ISvgIcons>;

declare const PlannedState: React$1.FC<ISvgIcons>;

declare const InProgressState: React$1.FC<ISvgIcons>;

declare const DoneState: React$1.FC<ISvgIcons>;

declare const PendingState: React$1.FC<ISvgIcons>;

declare const PiChatLogo: React$1.FC<ISvgIcons>;

declare const WorkspaceIcon: React$1.FC<ISvgIcons>;

declare const TeamsIcon: React$1.FC<ISvgIcons>;

declare const LeadIcon: React$1.FC<ISvgIcons>;

declare const ActivityIcon: React$1.FC<ISvgIcons>;

declare const UpdatesIcon: React$1.FC<ISvgIcons>;

declare const OverviewIcon: React$1.FC<ISvgIcons>;

declare const OnTrackIcon: React$1.FC<ISvgIcons>;

declare const OffTrackIcon: React$1.FC<ISvgIcons>;

declare const AtRiskIcon: React$1.FC<ISvgIcons>;

declare const RecentStickyIcon: React$1.FC<ISvgIcons>;

declare const StickyNoteIcon: React$1.FC<ISvgIcons>;

declare const BarIcon: React$1.FC<ISvgIcons>;

declare const TreeMapIcon: React$1.FC<ISvgIcons>;

declare const DisplayPropertiesIcon: React$1.FC<ISvgIcons>;

declare const AiIcon: React$1.FC<ISvgIcons>;

declare const PlaneNewIcon: React$1.FC<ISvgIcons>;

declare const WikiIcon: React$1.FC<ISvgIcons>;

declare const AccentureLogo: React$1.FC<ISvgIcons>;

declare const DolbyLogo: React$1.FC<ISvgIcons>;

declare const SonyLogo: React$1.FC<ISvgIcons>;

declare const ZerodhaLogo: React$1.FC<ISvgIcons>;

declare const PlaneLockup: React$1.FC<ISvgIcons>;

declare const PlaneLogo: React$1.FC<ISvgIcons>;

declare const PlaneWordmark: React$1.FC<ISvgIcons>;

type Props$b = {
    isOpen: boolean;
    title: React__default.ReactNode;
    hideChevron?: boolean;
    indicatorElement?: React__default.ReactNode;
    actionItemElement?: React__default.ReactNode;
    className?: string;
    titleClassName?: string;
    ChevronIcon?: React__default.FC<ISvgIcons>;
};
declare const CollapsibleButton: FC<Props$b>;

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    className?: string;
}
declare const ColorPicker: React$1.FC<ColorPickerProps>;

declare const MATERIAL_ICONS_LIST: {
    name: string;
}[];
declare const LUCIDE_ICONS_LIST: {
    name: string;
    element: React$1.ForwardRefExoticComponent<Omit<lucide_react.LucideProps, "ref"> & React$1.RefAttributes<SVGSVGElement>>;
}[];

declare enum ERowVariant {
    REGULAR = "regular",
    HUGGING = "hugging"
}
type TRowVariant = ERowVariant.REGULAR | ERowVariant.HUGGING;

interface ContentWrapperProps extends React$1.HTMLAttributes<HTMLDivElement> {
    variant?: TRowVariant;
    className?: string;
    children: React$1.ReactNode;
}
declare const ContentWrapper: React$1.ForwardRefExoticComponent<ContentWrapperProps & React$1.RefAttributes<HTMLDivElement>>;

type TControlLink = React$1.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    onClick: (event: React$1.MouseEvent<HTMLAnchorElement>) => void;
    children: React$1.ReactNode;
    target?: string;
    disabled?: boolean;
    className?: string;
    draggable?: boolean;
};
declare const ControlLink: React$1.ForwardRefExoticComponent<React$1.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    onClick: (event: React$1.MouseEvent<HTMLAnchorElement>) => void;
    children: React$1.ReactNode;
    target?: string;
    disabled?: boolean;
    className?: string;
    draggable?: boolean;
} & React$1.RefAttributes<HTMLAnchorElement>>;

interface IDragHandle {
    className?: string;
    disabled?: boolean;
}
declare const DragHandle: React__default.ForwardRefExoticComponent<IDragHandle & React__default.RefAttributes<HTMLButtonElement | null>>;

type Props$a = {
    isVisible: boolean;
    classNames?: string;
};
declare const DropIndicator: (props: Props$a) => React__default.JSX.Element;

interface IInputSearch {
    isOpen: boolean;
    query: string;
    updateQuery: (query: string) => void;
    inputIcon?: React__default.ReactNode;
    inputContainerClassName?: string;
    inputClassName?: string;
    inputPlaceholder?: string;
    isMobile: boolean;
}
declare const InputSearch: FC<IInputSearch>;

interface IDropdown {
  // root props
  onOpen?: () => void;
  onClose?: () => void;
  containerClassName?: string | ((isOpen: boolean) => string);
  tabIndex?: number;
  placement?: Placement$1;
  disabled?: boolean;

  // button props
  buttonContent?: (isOpen: boolean, value: string | string[] | undefined) => React.ReactNode;
  buttonContainerClassName?: string;
  buttonClassName?: string;

  // input props
  disableSearch?: boolean;
  inputPlaceholder?: string;
  inputClassName?: string;
  inputIcon?: React.ReactNode;
  inputContainerClassName?: string;

  // options props
  keyExtractor: (option: TDropdownOption) => string;
  optionsContainerClassName?: string;
  queryArray?: string[];
  sortByKey?: string;
  firstItem?: (optionValue: string) => boolean;
  renderItem?: ({
    value,
    selected,
    disabled,
  }: {
    value: string;
    selected: boolean;
    disabled?: boolean;
  }) => React.ReactNode;
  loader?: React.ReactNode;
  disableSorting?: boolean;
}

interface TDropdownOption {
  data: any;
  value: string;
  className?: ({ active, selected }: { active: boolean; selected?: boolean }) => string;
  disabled?: boolean;
}

interface IMultiSelectDropdown extends IDropdown {
  value: string[];
  onChange: (value: string[]) => void;
  options: TDropdownOption[] | undefined;
}

interface ISingleSelectDropdown extends IDropdown {
  value: string;
  onChange: (value: string) => void;
  options: TDropdownOption[] | undefined;
}

interface IDropdownButton {
  isOpen: boolean;
  buttonContent?: (isOpen: boolean, value: string | string[] | undefined) => React.ReactNode;
  buttonClassName?: string;
  buttonContainerClassName?: string;
  handleOnClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  setReferenceElement: (element: HTMLButtonElement | null) => void;
  disabled?: boolean;
}

interface IMultiSelectDropdownButton extends IDropdownButton {
  value: string[];
}

interface ISingleSelectDropdownButton extends IDropdownButton {
  value: string;
}

interface IDropdownOptions {
  isOpen: boolean;
  query: string;
  setQuery: (query: string) => void;

  inputPlaceholder?: string;
  inputClassName?: string;
  inputIcon?: React.ReactNode;
  inputContainerClassName?: string;
  disableSearch?: boolean;

  handleClose?: () => void;

  keyExtractor: (option: TDropdownOption) => string;
  renderItem:
    | (({ value, selected, disabled }: { value: string; selected: boolean; disabled?: boolean }) => React.ReactNode)
    | undefined;
  options: TDropdownOption[] | undefined;
  loader?: React.ReactNode;
  isMobile?: boolean;
}

interface IMultiSelectDropdownOptions extends IDropdownOptions {
  value: string[];
}

interface ISingleSelectDropdownOptions extends IDropdownOptions {
  value: string;
}

declare const DropdownButton: React__default.FC<IMultiSelectDropdownButton | ISingleSelectDropdownButton>;

declare const DropdownOptions: React__default.FC<IMultiSelectDropdownOptions | ISingleSelectDropdownOptions>;

declare const DropdownOptionsLoader: () => React__default.JSX.Element;

declare const MultiSelectDropdown: FC<IMultiSelectDropdown>;

declare const Dropdown: FC<ISingleSelectDropdown>;

declare enum EmojiIconPickerTypes {
    EMOJI = "emoji",
    ICON = "icon"
}
declare const TABS_LIST: {
    key: EmojiIconPickerTypes;
    title: string;
}[];
type TChangeHandlerProps = {
    type: EmojiIconPickerTypes.EMOJI;
    value: EmojiClickData;
} | {
    type: EmojiIconPickerTypes.ICON;
    value: {
        name: string;
        color: string;
    };
};
type TCustomEmojiPicker = {
    isOpen: boolean;
    handleToggle: (value: boolean) => void;
    buttonClassName?: string;
    className?: string;
    closeOnSelect?: boolean;
    defaultIconColor?: string;
    defaultOpen?: EmojiIconPickerTypes;
    disabled?: boolean;
    dropdownClassName?: string;
    label: React.ReactNode;
    onChange: (value: TChangeHandlerProps) => void;
    placement?: Placement$1;
    searchDisabled?: boolean;
    searchPlaceholder?: string;
    theme?: Theme;
    iconType?: "material" | "lucide";
};
declare const DEFAULT_COLORS: string[];
type TIconsListProps = {
    defaultColor: string;
    onChange: (val: {
        name: string;
        color: string;
    }) => void;
    searchDisabled?: boolean;
};
/**
 * Adjusts the given hex color to ensure it has enough contrast.
 * @param {string} hex - The hex color code input by the user.
 * @returns {string} - The adjusted hex color code.
 */
declare const adjustColorForContrast: (hex: string) => string;

declare const EmojiIconPicker: React__default.FC<TCustomEmojiPicker>;

declare const CustomEmojiIconPicker: React__default.FC<TCustomEmojiPicker>;

type TEmojiLogoProps = {
    in_use: "emoji" | "icon";
    emoji?: {
        value?: string;
        url?: string;
    };
    icon?: {
        name?: string;
        color?: string;
    };
};
type Props$9 = {
    logo: TEmojiLogoProps;
    size?: number;
    type?: "lucide" | "material";
};
declare const Logo: FC<Props$9>;

type Props$8 = {
    buttonClassName?: string;
    iconClassName?: string;
    onClick: (e: React__default.MouseEvent<HTMLButtonElement>) => void;
    selected: boolean;
};
declare const FavoriteStar: React__default.FC<Props$8>;

interface InputProps extends React$1.InputHTMLAttributes<HTMLInputElement> {
    mode?: "primary" | "transparent" | "true-transparent";
    inputSize?: "xs" | "sm" | "md";
    hasError?: boolean;
    className?: string;
    autoComplete?: "on" | "off";
}
declare const Input: React$1.ForwardRefExoticComponent<InputProps & React$1.RefAttributes<HTMLInputElement>>;

interface TextAreaProps extends React__default.TextareaHTMLAttributes<HTMLTextAreaElement> {
    mode?: "primary" | "transparent" | "true-transparent";
    textAreaSize?: "xs" | "sm" | "md";
    hasError?: boolean;
    className?: string;
}
declare const TextArea: React__default.ForwardRefExoticComponent<TextAreaProps & React__default.RefAttributes<HTMLTextAreaElement>>;

interface InputColorPickerProps {
    hasError: boolean;
    value: string | undefined;
    onChange: (value: string) => void;
    name: string;
    className?: string;
    style?: React$1.CSSProperties;
    placeholder: string;
}
declare const InputColorPicker: React$1.FC<InputColorPickerProps>;

interface CheckboxProps extends React$1.InputHTMLAttributes<HTMLInputElement> {
    containerClassName?: string;
    iconClassName?: string;
    indeterminate?: boolean;
}
declare const Checkbox: React$1.ForwardRefExoticComponent<CheckboxProps & React$1.RefAttributes<HTMLInputElement>>;

interface LabelProps {
    htmlFor: string;
    children: React__default.ReactNode;
    className?: string;
}
declare const Label: React__default.FC<LabelProps>;
interface FormFieldProps {
    label: string;
    htmlFor: string;
    children: React__default.ReactNode;
    className?: string;
    optional?: boolean;
}
declare const FormField: React__default.FC<FormFieldProps>;
interface ValidationMessageProps {
    type: "error" | "success";
    message: string;
    className?: string;
}
declare const ValidationMessage: React__default.FC<ValidationMessageProps>;

interface PasswordStrengthIndicatorProps {
    password: string;
    showCriteria?: boolean;
    isFocused?: boolean;
}
declare const PasswordStrengthIndicator: React__default.FC<PasswordStrengthIndicatorProps>;

interface StrengthInfo {
    message: string;
    textColor: string;
    activeFragments: number;
}
/**
 * Get strength information including message, color, and active fragments
 */
declare const getStrengthInfo: (strength: E_PASSWORD_STRENGTH) => StrengthInfo;
/**
 * Get fragment color based on position and active state
 */
declare const getFragmentColor: (fragmentIndex: number, activeFragments: number) => string;

interface PasswordInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    showToggle?: boolean;
    error?: boolean;
}
declare const PasswordInput: React__default.FC<PasswordInputProps>;

declare enum EHeaderVariant {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    TERNARY = "ternary"
}
type THeaderVariant = EHeaderVariant.PRIMARY | EHeaderVariant.SECONDARY | EHeaderVariant.TERNARY;

interface HeaderProps {
    variant?: THeaderVariant;
    setHeight?: boolean;
    className?: string;
    children: React$1.ReactNode;
    showOnMobile?: boolean;
}
declare const Header: {
    (props: HeaderProps): React$1.JSX.Element;
    LeftItem: (props: HeaderProps) => React$1.JSX.Element;
    RightItem: (props: HeaderProps) => React$1.JSX.Element;
    displayName: string;
};

type TLinkItemBlockProps = {
    title: string;
    url: string;
    createdAt?: Date | string;
    menuItems?: TContextMenuItem[];
    onClick?: () => void;
};
declare const LinkItemBlock: FC<TLinkItemBlockProps>;

type Props$7 = {
    children: React__default.ReactNode;
    className?: string;
};
declare const Loader: {
    ({ children, className }: Props$7): React__default.JSX.Element;
    Item: React__default.FC<ItemProps>;
    displayName: string;
};
type ItemProps = {
    height?: string;
    width?: string;
    className?: string;
};

declare enum EModalPosition {
    TOP = "flex items-center justify-center text-center mx-4 my-10 md:my-20",
    CENTER = "flex items-end sm:items-center justify-center p-4 min-h-full"
}
declare enum EModalWidth {
    SM = "sm:max-w-sm",
    MD = "sm:max-w-md",
    LG = "sm:max-w-lg",
    XL = "sm:max-w-xl",
    XXL = "sm:max-w-2xl",
    XXXL = "sm:max-w-3xl",
    XXXXL = "sm:max-w-4xl",
    VXL = "sm:max-w-5xl",
    VIXL = "sm:max-w-6xl",
    VIIXL = "sm:max-w-7xl"
}

type TModalVariant = "danger" | "primary";
type Props$6 = {
    content: React__default.ReactNode | string;
    handleClose: () => void;
    handleSubmit: () => void;
    hideIcon?: boolean;
    isSubmitting: boolean;
    isOpen: boolean;
    position?: EModalPosition;
    primaryButtonText?: {
        loading: string;
        default: string;
    };
    secondaryButtonText?: string;
    title: string;
    variant?: TModalVariant;
    width?: EModalWidth;
};
declare const AlertModalCore: React__default.FC<Props$6>;

type Props$5 = {
    children: React__default.ReactNode;
    handleClose?: () => void;
    isOpen: boolean;
    position?: EModalPosition;
    width?: EModalWidth;
    className?: string;
};
declare const ModalCore: React__default.FC<Props$5>;

type TPopoverButtonDefaultOptions = {
    button?: ReactNode;
    buttonClassName?: string;
    buttonRefClassName?: string;
    disabled?: boolean;
};
type TPopoverDefaultOptions = TPopoverButtonDefaultOptions & {
    popperPosition?: Placement$1 | undefined;
    popperPadding?: number | undefined;
    panelClassName?: string;
    popoverClassName?: string;
    popoverButtonRef?: MutableRefObject<HTMLButtonElement | null>;
};
type TPopover = TPopoverDefaultOptions & {
    children: ReactNode;
};
type TPopoverMenu<T> = TPopoverDefaultOptions & {
    data: T[];
    keyExtractor: (item: T, index: number) => string;
    render: (item: T, index: number) => ReactNode;
};

declare const Popover: (props: TPopover) => React__default.JSX.Element;

declare const PopoverMenu: <T>(props: TPopoverMenu<T>) => React__default.JSX.Element;

interface IRadialProgressBar {
    progress: number;
}
declare const RadialProgressBar: FC<IRadialProgressBar>;

type Props$4 = {
    maxValue?: number;
    value?: number;
    radius?: number;
    strokeWidth?: number;
    activeStrokeColor?: string;
    inactiveStrokeColor?: string;
};
declare const ProgressBar: React__default.FC<Props$4>;

type Props$3 = {
    data: any;
    noTooltip?: boolean;
    inPercentage?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    barClassName?: string;
};
declare const LinearProgressIndicator: React__default.FC<Props$3>;

interface ICircularProgressIndicator {
    size: number;
    percentage: number;
    strokeWidth?: number;
    strokeColor?: string;
    children?: React__default.ReactNode;
}
declare const CircularProgressIndicator: React__default.FC<ICircularProgressIndicator>;

interface RowProps extends React$1.HTMLAttributes<HTMLDivElement> {
    variant?: TRowVariant;
    className?: string;
    children: React$1.ReactNode;
}
declare const Row: React$1.ForwardRefExoticComponent<RowProps & React$1.RefAttributes<HTMLDivElement>>;

type TScrollAreaProps = {
    type?: "auto" | "always" | "scroll" | "hover";
    className?: string;
    scrollHideDelay?: number;
    size?: "sm" | "md" | "lg";
    children: React__default.ReactNode;
};
declare const ScrollArea: FC<TScrollAreaProps>;

type TEnhancedData<T> = T & {
    __uuid__?: string;
};
type Props$2<T> = {
    data: TEnhancedData<T>[];
    render: (item: T, index: number) => React__default.ReactNode;
    onChange: (data: T[], movedItem?: T) => void;
    keyExtractor: (item: T, index: number) => string;
    containerClassName?: string;
    id?: string;
};
declare const Sortable: <T>({ data, render, onChange, keyExtractor, containerClassName, id }: Props$2<T>) => React__default.JSX.Element;

type Props$1 = {
    children: React__default.ReactNode;
    data: any;
    className?: string;
};
declare const Draggable: ({ children, data, className }: Props$1) => React__default.JSX.Element;

interface ISpinner extends React$1.SVGAttributes<SVGElement> {
    height?: string;
    width?: string;
    className?: string | undefined;
}
declare const Spinner: React$1.FC<ISpinner>;

interface ICircularBarSpinner extends React$1.SVGAttributes<SVGElement> {
    height?: string;
    width?: string;
    className?: string | undefined;
}
declare const CircularBarSpinner: React$1.FC<ICircularBarSpinner>;

type TTableColumn<T> = {
    key: string;
    content: string;
    thRender?: () => React.ReactNode;
    tdRender: (rowData: T) => React.ReactNode;
};
type TTableData<T> = {
    data: T[];
    columns: TTableColumn<T>[];
    keyExtractor: (rowData: T) => string;
    tableClassName?: string;
    tHeadClassName?: string;
    tHeadTrClassName?: string;
    thClassName?: string;
    tBodyClassName?: string;
    tBodyTrClassName?: string;
    tdClassName?: string;
};

declare const Table: <T>(props: TTableData<T>) => React__default.JSX.Element;

type TabListItem = {
    key: string;
    icon?: FC<LucideProps>;
    label?: React__default.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
};
type TTabListProps = {
    tabs: TabListItem[];
    tabListClassName?: string;
    tabClassName?: string;
    size?: "sm" | "md" | "lg";
    selectedTab?: string;
    onTabChange?: (key: string) => void;
};
declare const TabList: FC<TTabListProps>;

type TabContent = {
    content: React__default.ReactNode;
};
type TabItem = TabListItem & TabContent;
type TTabsProps = {
    tabs: TabItem[];
    storageKey?: string;
    actions?: React__default.ReactNode;
    defaultTab?: string;
    containerClassName?: string;
    tabListContainerClassName?: string;
    tabListClassName?: string;
    tabClassName?: string;
    tabPanelClassName?: string;
    size?: "sm" | "md" | "lg";
    storeInLocalStorage?: boolean;
};
declare const Tabs: FC<TTabsProps>;

declare enum ETagVariant {
    OUTLINED = "outlined"
}
declare enum ETagSize {
    SM = "sm",
    LG = "lg"
}
type TTagVariant = ETagVariant.OUTLINED;
type TTagSize = ETagSize.SM | ETagSize.LG;

interface TagProps extends React$1.ComponentProps<"div"> {
    variant?: TTagVariant;
    size?: TTagSize;
    className?: string;
    children: React$1.ReactNode;
}
declare const Tag: React$1.ForwardRefExoticComponent<Omit<TagProps, "ref"> & React$1.RefAttributes<HTMLDivElement>>;

declare enum TOAST_TYPE {
    SUCCESS = "success",
    ERROR = "error",
    INFO = "info",
    WARNING = "warning",
    LOADING = "loading"
}
type SetToastProps = {
    type: TOAST_TYPE.LOADING;
    title?: string;
} | {
    id?: string | number;
    type: Exclude<TOAST_TYPE, TOAST_TYPE.LOADING>;
    title: string;
    message?: string;
    actionItems?: React$1.ReactNode;
};
type PromiseToastCallback<ToastData> = (data: ToastData) => string;
type ActionItemsPromiseToastCallback<ToastData> = (data: ToastData) => React$1.ReactNode;
type PromiseToastData<ToastData> = {
    title: string;
    message?: PromiseToastCallback<ToastData>;
    actionItems?: ActionItemsPromiseToastCallback<ToastData>;
};
type PromiseToastOptions<ToastData> = {
    loading?: string;
    success: PromiseToastData<ToastData>;
    error: PromiseToastData<ToastData>;
};
type ToastProps = {
    theme: "light" | "dark" | "system";
};
declare const Toast: (props: ToastProps) => React$1.JSX.Element;
declare const setToast: (props: SetToastProps) => string | number;
declare const setPromiseToast: <ToastData>(promise: Promise<ToastData>, options: PromiseToastOptions<ToastData>) => void;

type TPosition = "top" | "right" | "bottom" | "left" | "auto" | "auto-end" | "auto-start" | "bottom-left" | "bottom-right" | "left-bottom" | "left-top" | "right-bottom" | "right-top" | "top-left" | "top-right";
interface ITooltipProps {
    tooltipHeading?: string;
    tooltipContent: string | React__default.ReactNode;
    position?: TPosition;
    children: React__default.ReactElement;
    disabled?: boolean;
    className?: string;
    openDelay?: number;
    closeDelay?: number;
    isMobile?: boolean;
    renderByDefault?: boolean;
}
declare const Tooltip: React__default.FC<ITooltipProps>;

type Props = {
    children: React__default.ReactNode;
    className?: string;
    noMargin?: boolean;
};
declare const SubHeading: ({ children, className, noMargin }: Props) => React__default.JSX.Element;

declare const cn: (...inputs: ClassValue[]) => string;

/**
 * Returns a random icon name from the LUCIDE_ICONS_LIST array
 */
declare const getRandomIconName: () => string;

declare const getSubscriptionTextColor: (planVariant: EProductSubscriptionEnum, shade?: "200" | "400") => string;
declare const getSubscriptionBackgroundColor: (planVariant: EProductSubscriptionEnum, shade?: "50" | "100" | "200" | "400") => string;
declare const getSubscriptionBorderColor: (planVariant: EProductSubscriptionEnum, shade?: "200" | "400") => string;
declare const getUpgradeButtonStyle: (planVariant: EProductSubscriptionEnum, isDisabled: boolean) => string | undefined;
declare const getUpgradeCardVariantStyle: (planVariant: EProductSubscriptionEnum) => string | undefined;
declare const getSuccessModalVariantStyle: (planVariant: EProductSubscriptionEnum) => string;
declare const getBillingAndPlansCardVariantStyle: (planVariant: EProductSubscriptionEnum) => string;
declare const getSubscriptionTextAndBackgroundColor: (planVariant: EProductSubscriptionEnum) => string;
declare const getDiscountPillStyle: (planVariant: EProductSubscriptionEnum) => string;

type TOAuthOption = {
    id: string;
    text: string;
    icon: React$1.ReactNode;
    onClick: () => void;
    enabled?: boolean;
};
type OAuthOptionsProps = {
    options: TOAuthOption[];
    compact?: boolean;
    className?: string;
    containerClassName?: string;
};
declare const OAuthOptions: (props: OAuthOptionsProps) => React$1.JSX.Element | null;

export { AccentureLogo, ActivityIcon, AiIcon, AlertModalCore, ArchiveIcon, AtRiskIcon, Avatar, AvatarGroup, BacklogGroupIcon, Badge, type BadgeProps, BarIcon, BlockedIcon, BlockerIcon, BreadcrumbIcon, BreadcrumbItem, BreadcrumbItemLoader, BreadcrumbItemWrapper, BreadcrumbLabel, BreadcrumbNavigationDropdown, BreadcrumbNavigationSearchDropdown, BreadcrumbSeparator, Breadcrumbs, Button, type ButtonProps, CYCLE_GROUP_COLORS, CYCLE_GROUP_I18N_LABELS, Calendar, CalendarAfterIcon, CalendarBeforeIcon, type CalendarProps, CancelledGroupIcon, Card, type CardProps, CenterPanelIcon, Checkbox, type CheckboxProps, CircleDotFullIcon, CircularBarSpinner, CircularProgressIndicator, Collapsible, CollapsibleButton, ColorPicker, ComboDropDown, ComboInput, ComboOption, ComboOptions, CommentFillIcon, CompletedGroupIcon, ContentWrapper, type ContentWrapperProps, ContextMenu, ContextMenuContext, ContextMenuItem, ContrastIcon, ControlLink, CreateIcon, CustomEmojiIconPicker, CustomMenu, CustomSearchSelect, CustomSelect, CycleGroupIcon, DEFAULT_COLORS, DiceIcon, DiscordIcon, DisplayPropertiesIcon, DolbyLogo, DoneState, DoubleCircleIcon, DragHandle, Draggable, DropIndicator, Dropdown, DropdownButton, DropdownIcon, DropdownOptions, DropdownOptionsLoader, ECardDirection, ECardSpacing, ECardVariant, EHeaderVariant, EModalPosition, EModalWidth, ERowVariant, ETagSize, ETagVariant, EmojiIconPicker, EmojiIconPickerTypes, EpicIcon, FavoriteFolderIcon, FavoriteStar, FormField, FullScreenPanelIcon, GithubIcon, GitlabIcon, Header, type HeaderProps, type IButtonStyling, type ICycleGroupIcon, type ISpinner, type ISvgIcons, InProgressState, InfoFillIcon, InfoIcon, Input, InputColorPicker, type InputColorPickerProps, type InputProps, InputSearch, Intake, LUCIDE_ICONS_LIST, Label, LayerStackIcon, LayersIcon, LeadIcon, LinearProgressIndicator, LinkItemBlock, Loader, Logo, MATERIAL_ICONS_LIST, ModalCore, ModuleBacklogIcon, ModuleCancelledIcon, ModuleCompletedIcon, ModuleInProgressIcon, ModulePausedIcon, ModulePlannedIcon, ModuleStatusIcon, MonospaceIcon, MultiSelectDropdown, OAuthOptions, OffTrackIcon, OnTrackIcon, OverviewIcon, PasswordInput, PasswordStrengthIndicator, type PasswordStrengthIndicatorProps, PendingState, PhotoFilterIcon, PiChatLogo, PlaneLockup, PlaneLogo, PlaneNewIcon, PlaneWordmark, PlannedState, Popover, PopoverMenu, Portal, PriorityIcon, ProgressBar, type Props$c as Props, RadialProgressBar, RecentStickyIcon, RelatedIcon, Row, type RowProps, SansSerifIcon, ScrollArea, SerifIcon, SidePanelIcon, SonyLogo, Sortable, Spinner, StartedGroupIcon, StateGroupIcon, StickyNoteIcon, type StrengthInfo, SubHeading, TABS_LIST, type TAvatarSize, type TButtonSizes, type TButtonVariant, type TChangeHandlerProps, type TCollapsibleProps, type TContextMenuItem, type TControlLink, type TCustomEmojiPicker, type TCycleGroups, type TEmojiLogoProps, type TIconsListProps, type TIssuePriorities, type TLinkItemBlockProps, type TModalVariant, type TModuleStatus, TOAST_TYPE, type TOAuthOption, type TPosition, type TabContent, type TabItem, TabList, type TabListItem, Table, Tabs, Tag, type TagProps, TeamsIcon, TextArea, type TextAreaProps, Toast, ToggleSwitch, Tooltip, TransferIcon, TreeMapIcon, UnstartedGroupIcon, UpdatesIcon, UserActivityIcon, ValidationMessage, WikiIcon, WorkspaceIcon, ZerodhaLogo, adjustColorForContrast, buttonStyling, cn, getBillingAndPlansCardVariantStyle, getBorderRadius, getButtonStyling, getDiscountPillStyle, getFragmentColor, getIconStyling, getRandomIconName, getSizeInfo, getStrengthInfo, getSubscriptionBackgroundColor, getSubscriptionBorderColor, getSubscriptionTextAndBackgroundColor, getSubscriptionTextColor, getSuccessModalVariantStyle, getUpgradeButtonStyle, getUpgradeCardVariantStyle, isAValidNumber, setPromiseToast, setToast };
