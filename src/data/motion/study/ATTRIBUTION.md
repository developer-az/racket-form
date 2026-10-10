# Study-clip attribution

Reconstructed pose clips in this folder are processed from public
coaching / biomechanics videos. The videos themselves are **not** bundled.

## Groundstrokes, slice, volley

| Clip | Source | Author | License |
| --- | --- | --- | --- |
| `forehand.json` | [Drive con pelota.ogv](https://commons.wikimedia.org/wiki/File:Drive_con_pelota.ogv) | Dardo 86 7 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) |
| `backhand-1h.json` | [Reves una mano con pelota.ogv](https://commons.wikimedia.org/wiki/File:Reves_una_mano_con_pelota.ogv) | Dardo 86 7 | CC BY-SA 3.0 |
| `backhand-2h.json` | [Reves dos manos con pelota.ogv](https://commons.wikimedia.org/wiki/File:Reves_dos_manos_con_pelota.ogv) | Dardo 86 7 | CC BY-SA 3.0 |
| `slice.json` | [Slice con pelota.ogv](https://commons.wikimedia.org/wiki/File:Slice_con_pelota.ogv) | Dardo 86 7 | CC BY-SA 3.0 |
| `volley.json` | [Volea con pelota.ogv](https://commons.wikimedia.org/wiki/File:Volea_con_pelota.ogv) | Dardo 86 7 | CC BY-SA 3.0 |

These reconstructed clips are shared under the same **CC BY-SA 3.0** terms
as the source videos.

## Serve

| Clip | Source | Author | License |
| --- | --- | --- | --- |
| `serve.json` | [Movie 1](https://commons.wikimedia.org/wiki/File:Intention-understanding-over-T-a-neuroimaging-study-on-shared-representations-and-tennis-return-Movie1.ogv) from Cacioppo et al., *Frontiers in Human Neuroscience* (2014) | Cacioppo S. et al. | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Pipeline: MediaPipe Pose Landmarker (lite, CPU) → `reconstructClip` (plant IK, ground clamp, racket continuity). Not an authored mannequin.
