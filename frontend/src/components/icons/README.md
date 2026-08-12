# Local Lucide icons

The application owns its icon markup locally. It does not install or load a Lucide package, icon font, sprite, web component, or runtime CDN resource.

## Upstream source

- Project: [Lucide](https://github.com/lucide-icons/lucide)
- Pinned revision: `a7c781bd43dbf295a4c2ab07d25d544dd7879bf9`
- Retrieved/verified: 2026-08-12
- License: [LUCIDE_LICENSE.txt](LUCIDE_LICENSE.txt)

`Icons.tsx` copies the SVG child geometry from the matching files under the upstream `icons/` directory. The exported application names intentionally remain stable while the Lucide source names are recorded here.

| Application component | Lucide source icon |
| --- | --- |
| `BrandMarkIcon` | `scan-search` |
| `CaretIcon` | `chevron-right` |
| `HomeIcon` | `house` |
| `ProjectIcon` | `layers` |
| `FolderProjectIcon` | `folder` |
| `TerminalProjectIcon` | `square-terminal` |
| `ShieldProjectIcon` | `shield-check` |
| `ChartProjectIcon` | `chart-no-axes-column-increasing` |
| `SparkleProjectIcon` | `sparkles` |
| `GlobeProjectIcon` | `globe` |
| `RequirementsIcon` | `clipboard-check` |
| `CodebaseIcon` | `code-xml` |
| `ReportIcon` | `file-chart-column` |
| `LogsIcon` | `logs` |
| `CheckIcon` | `check` |
| `WarningIcon` | `triangle-alert` |
| `BellIcon` | `bell` |
| `SunIcon` | `sun` |
| `MoonIcon` | `moon` |
| `MenuIcon` | `menu` |
| `CloseIcon` | `x` |
| `PencilIcon` | `pencil` |
| `PlusIcon` | `plus` |
| `DownloadIcon` | `download` |
| `TrashIcon` | `trash-2` |
| `SearchIcon` | `search` |
| `PanelLeftCloseIcon` | `panel-left-close` |
| `PanelLeftOpenIcon` | `panel-left-open` |
| `ArrowIcon` | `arrow-right` |
| `UploadIcon` | `upload` |
| `CircleCheckIcon` | `circle-check` |
| `CircleXIcon` | `circle-x` |
| `CircleAlertIcon` | `circle-alert` |

## Modifying an icon

1. Edit the relevant React component's SVG children in `Icons.tsx`. Each component is intentionally small and has no generated wrapper code.
2. Change global Lucide defaults once in `LucideIcon` when the whole set needs a different view box, stroke width, cap, join, or accessibility default.
3. Continue using `currentColor`; consumers own size and color through ordinary SVG props and CSS Modules.
4. When updating from upstream, fetch the raw SVG from a pinned Lucide commit, copy only its child geometry, update the mapping/revision here, and review the license before committing.

The shared indeterminate spinner and report chart SVGs are visualizations, not interface icons, and remain in their owning components.
