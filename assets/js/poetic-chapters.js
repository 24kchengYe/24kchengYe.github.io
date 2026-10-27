/* Original chapter drawings; no network calls, third-party libraries or reading-state access.
   Text translations are prepared for this site; title attributes preserve original wording. */
(() => {
  'use strict';
  if (window.PoeticChapters) { window.PoeticChapters.mount(); return; }
  window.__poeticChaptersMounted = true;
  const drawings = {"writing": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 820 360\" fill=\"none\" role=\"img\" aria-labelledby=\"poetic-writing-title\"> <title id=\"poetic-writing-title\">A current becoming the folds of a page</title> <g stroke=\"#41453f\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path data-start=\"0\" data-duration=\"1900\" data-phase=\"current-to-crest\" stroke-width=\"1.65\" d=\"M42 266 C101 260 120 237 163 237 C204 238 225 259 274 257 C315 255 341 222 379 215 C418 207 449 225 492 223 C529 222 548 196 580 192 C615 187 654 200 678 192 C704 184 711 162 700 151 C688 138 668 147 665 162 C660 183 679 204 715 216 C741 225 758 227 786 225\"/> <path data-start=\"100\" data-duration=\"1250\" data-phase=\"current\" stroke-width=\"1.5\" d=\"M48 282 C96 279 128 253 165 253 C206 253 230 274 276 273 C322 271 347 239 382 232 C417 223 450 240 493 239 C539 236 556 214 584 210 C616 205 648 215 675 211\"/> <path data-start=\"230\" data-duration=\"1300\" data-phase=\"current\" stroke-width=\"1.35\" d=\"M62 299 C109 294 134 269 169 271 C208 273 237 290 278 289 C322 288 351 256 386 249 C423 242 458 257 499 255 C542 252 562 232 588 228 C615 225 636 231 661 229\"/> <path data-start=\"380\" data-duration=\"1150\" data-phase=\"current\" stroke-width=\"1.05\" d=\"M86 315 C124 308 145 289 176 290 C217 291 239 306 279 305 C326 303 355 275 391 267 C423 261 454 273 489 273\"/> <path data-start=\"640\" data-duration=\"960\" data-phase=\"current\" stroke-width=\"1\" d=\"M147 322 C173 315 189 313 209 317 M295 321 C338 315 362 292 397 284 C429 278 454 288 480 289\"/> <path data-start=\"880\" data-duration=\"740\" data-phase=\"current\" stroke-width=\"1.1\" d=\"M512 271 C546 268 564 252 589 246 C616 241 639 247 663 246\"/> <path data-start=\"1080\" data-duration=\"580\" data-phase=\"current\" stroke-width=\".9\" d=\"M531 287 C556 282 576 270 595 266 C615 262 631 266 648 265\"/> <path data-start=\"2080\" data-duration=\"380\" data-phase=\"wake\" stroke-width=\"1.05\" d=\"M711 236 C739 244 760 244 784 242 M697 250 C724 259 746 261 771 258\"/> <path data-start=\"2260\" data-duration=\"340\" data-phase=\"wake\" stroke-width=\".85\" d=\"M692 267 C715 274 737 278 757 275\"/> <path data-start=\"2420\" data-duration=\"380\" data-phase=\"wake\" stroke-width=\".8\" d=\"M685 283 C708 291 724 294 743 291\"/> <path data-start=\"1720\" data-duration=\"420\" data-phase=\"curl\" stroke-width=\"1.05\" d=\"M668 183 C652 168 652 146 667 135 C680 126 700 128 711 139\"/> <path data-start=\"1950\" data-duration=\"350\" data-phase=\"curl\" stroke-width=\".75\" d=\"M685 119 C700 118 712 124 719 132\"/> <path data-start=\"2100\" data-duration=\"370\" data-phase=\"curl\" stroke-width=\".8\" d=\"M726 153 C733 174 743 185 758 190\"/> <path data-start=\"2310\" data-duration=\"260\" data-phase=\"spray\" stroke-width=\".8\" d=\"M667 106 C675 103 681 103 688 104\"/> <path data-start=\"2410\" data-duration=\"220\" data-phase=\"spray\" stroke-width=\"1\" d=\"M635 128 C638 123 641 121 644 120\"/> <path data-start=\"2510\" data-duration=\"240\" data-phase=\"spray\" stroke-width=\".9\" d=\"M736 115 C740 116 742 118 744 122\"/> <path data-start=\"2600\" data-duration=\"200\" data-phase=\"spray\" stroke-width=\".8\" d=\"M629 178 L634 174\"/>  <path data-start=\"2010\" data-duration=\"350\" data-phase=\"echo\" stroke-width=\".7\" d=\"M340 201 C354 193 365 191 378 192 M439 202 C453 206 466 207 480 204\"/> <path data-start=\"2270\" data-duration=\"320\" data-phase=\"echo\" stroke-width=\".65\" d=\"M537 180 C550 174 561 173 573 174\"/> </g> <g stroke=\"#41453f\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path data-start=\"1580\" data-duration=\"530\" data-phase=\"page-from-current\" stroke-width=\"1.1\" d=\"M158 233 L179 174 C207 168 234 174 253 188 L240 241 M253 188 C273 174 296 174 320 183 L301 240\"/><path data-start=\"1840\" data-duration=\"380\" data-phase=\"page-fold\" stroke-width=\".9\" d=\"M253 188 L240 241 M184 181 C207 178 225 183 240 191 M267 190 C283 183 297 184 310 188\"/><path data-start=\"2130\" data-duration=\"320\" data-phase=\"words-follow-the-fold\" stroke-width=\".65\" d=\"M186 195 C202 191 215 194 228 199 M183 205 C199 202 211 205 222 209 M273 203 C284 199 293 200 302 202 M270 213 C282 209 290 211 297 213\"/></g></svg>", "research": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 820 360\" fill=\"none\" role=\"img\" aria-labelledby=\"poetic-research-title\"> <title id=\"poetic-research-title\">A river through a quiet city</title> <g stroke=\"#41453f\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path data-start=\"0\" data-duration=\"800\" data-phase=\"river-scale\" stroke-width=\"1.65\" d=\"M37 305 C109 299 128 268 179 260 C225 252 248 266 278 249 C311 231 303 206 339 195 C376 184 411 189 450 176 C491 163 499 145 531 138 C562 131 589 134 611 121\"/> <path data-start=\"120\" data-duration=\"850\" data-phase=\"river-scale\" stroke-width=\"1.45\" d=\"M65 338 C128 329 158 290 198 285 C245 279 273 293 312 271 C350 250 338 224 371 216 C411 206 433 211 474 196 C512 182 527 163 554 157 C581 151 601 149 622 139\"/> <path data-start=\"180\" data-duration=\"520\" data-phase=\"near-terrain\" stroke-width=\"1\" d=\"M25 272 C91 265 108 236 149 231 C182 227 217 234 245 222 M70 227 C98 209 120 205 153 208 M100 193 C137 178 169 182 192 192\"/> <path data-start=\"380\" data-duration=\"560\" data-phase=\"middle-terrain\" stroke-width=\".85\" d=\"M267 183 C306 169 329 177 359 166 C385 155 392 140 419 135 M287 154 C318 148 340 156 364 143\"/> <path data-start=\"650\" data-duration=\"540\" data-phase=\"far-terrain\" stroke-width=\".9\" d=\"M414 253 C448 240 487 246 522 234 C559 221 567 202 599 197 C638 191 663 204 703 192 C738 181 755 167 788 169\"/> <path data-start=\"850\" data-duration=\"480\" data-phase=\"far-terrain\" stroke-width=\".8\" d=\"M465 278 C498 267 525 267 546 257 C576 242 587 227 616 224 C652 220 673 230 703 224 M530 302 C559 287 579 269 604 260 C630 253 649 258 671 251\"/> <path data-start=\"1120\" data-duration=\"400\" data-phase=\"near-buildings\" stroke-width=\"1.2\" d=\"M158 232 L157 197 L178 181 L201 196 L201 235 M157 197 L181 204 L201 196 M181 204 L181 237\"/> <path data-start=\"2000\" data-duration=\"200\" data-phase=\"observe-near\" stroke-width=\".85\" d=\"M164 208 L173 210 L173 218 L165 216 Z M187 210 L195 207 L195 216 L187 219 Z M165 223 L173 225\"/> <path data-start=\"1300\" data-duration=\"380\" data-phase=\"near-buildings\" stroke-width=\"1.1\" d=\"M217 221 L216 191 L235 181 L255 191 L255 211 M216 191 L237 198 L255 191 M237 198 L237 217\"/> <path data-start=\"2120\" data-duration=\"180\" data-phase=\"observe-near\" stroke-width=\".8\" d=\"M222 200 L230 203 L230 210 M243 204 L250 202\"/> <path data-start=\"1450\" data-duration=\"400\" data-phase=\"middle-buildings\" stroke-width=\"1.2\" d=\"M416 173 L415 125 L432 113 L452 125 L453 170 M415 125 L435 132 L452 125 M435 132 L436 172\"/> <path data-start=\"2220\" data-duration=\"220\" data-phase=\"observe-middle\" stroke-width=\".8\" d=\"M422 138 L428 140 M422 148 L428 150 M422 158 L428 160 M441 140 L447 138 M441 150 L447 148 M441 160 L447 158\"/> <path data-start=\"1610\" data-duration=\"350\" data-phase=\"middle-buildings\" stroke-width=\"1.05\" d=\"M464 163 L463 137 L478 129 L494 138 L494 152 M463 137 L480 143 L494 138 M480 143 L480 158\"/> <path data-start=\"1740\" data-duration=\"320\" data-phase=\"far-buildings\" stroke-width=\"1.05\" d=\"M619 190 L618 161 L642 151 L662 161 L663 194 M618 161 L640 170 L662 161 M640 170 L640 194\"/> <path data-start=\"2380\" data-duration=\"180\" data-phase=\"observe-far\" stroke-width=\".8\" d=\"M625 174 L632 177 M625 183 L632 186 M647 175 L655 171 M647 184 L655 180\"/> <path data-start=\"1880\" data-duration=\"300\" data-phase=\"far-buildings\" stroke-width=\"1\" d=\"M681 191 L681 170 L697 163 L713 169 L713 186 M681 170 L698 176 L713 169 M698 176 L698 188\"/> <path data-start=\"730\" data-duration=\"520\" data-phase=\"open-horizon\" stroke-width=\".8\" d=\"M617 108 C649 101 665 88 691 85 C721 82 742 92 773 86\"/> <path data-start=\"1040\" data-duration=\"330\" data-phase=\"open-horizon\" stroke-width=\".7\" d=\"M643 122 C670 116 692 106 710 108 M735 112 C750 115 764 111 777 108\"/> <path data-start=\"2170\" data-duration=\"320\" data-phase=\"river-detail\" stroke-width=\".8\" d=\"M369 202 C386 200 398 201 409 198 M305 261 C318 253 324 244 325 238 M160 283 C174 277 186 275 197 275\"/> <path data-start=\"2410\" data-duration=\"280\" data-phase=\"river-detail\" stroke-width=\".75\" d=\"M469 187 C486 183 500 176 509 169 M549 149 L568 145\"/> <path data-start=\"2420\" data-duration=\"380\" data-phase=\"life-at-scale\" stroke-width=\".8\" d=\"M100 250 L102 235 M98 241 C91 241 91 231 97 230 C94 221 106 219 108 228 C115 229 114 239 106 239 M577 197 L579 183 M574 188 C567 187 569 179 575 179 C574 172 584 170 586 179 C592 180 590 187 584 187\"/> </g> </svg>", "projects": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 820 360\" fill=\"none\" role=\"img\" aria-labelledby=\"poetic-projects-title\"> <title id=\"poetic-projects-title\">A small bridge joining two river banks</title> <g stroke=\"#41453f\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path data-start=\"180\" data-duration=\"650\" data-phase=\"banks\" stroke-width=\"1.5\" d=\"M31 244 C74 236 94 216 127 213 C162 210 183 224 215 217 C238 211 252 195 279 197 L299 201\"/> <path data-start=\"310\" data-duration=\"580\" data-phase=\"banks\" stroke-width=\"1.45\" d=\"M552 200 C575 200 597 211 626 208 C654 205 674 189 704 190 C738 191 756 201 790 192\"/> <path data-start=\"1000\" data-duration=\"570\" data-phase=\"bridge-connection\" stroke-width=\"1.7\" d=\"M289 202 C323 185 345 154 382 145 C410 138 436 141 459 149 C493 162 512 190 552 200\"/> <path data-start=\"1170\" data-duration=\"570\" data-phase=\"bridge-connection\" stroke-width=\"1.45\" d=\"M292 215 C324 199 349 169 384 159 C413 152 436 154 458 162 C491 174 515 201 550 214\"/> <path data-start=\"600\" data-duration=\"650\" data-phase=\"bridge-support\" stroke-width=\"1.5\" d=\"M318 225 C338 194 365 179 388 173 C421 165 447 173 469 184 C489 194 506 210 518 228 M318 225 L316 242 L326 244 M518 228 L519 243 L510 245\"/> <path data-start=\"1700\" data-duration=\"340\" data-phase=\"bridge-railing\" stroke-width=\".9\" d=\"M307 194 L308 207 M330 178 L331 190 M355 161 L356 174 M382 146 L384 159 M410 141 L410 155 M436 142 L435 155 M462 151 L459 164 M487 166 L484 178 M513 184 L508 195 M537 195 L532 207\"/> <path data-start=\"2050\" data-duration=\"290\" data-phase=\"bridge-stones\" stroke-width=\".95\" d=\"M326 214 L337 218 M340 196 L349 203 M359 183 L365 191 M380 176 L384 183 M405 171 L405 179 M430 174 L428 181 M453 180 L449 188 M474 191 L469 198 M492 205 L485 211 M509 221 L500 226\"/> <path data-start=\"1720\" data-duration=\"400\" data-phase=\"bank-echo\" stroke-width=\"1.1\" d=\"M51 268 C93 260 119 242 148 241 C178 241 195 248 219 243 C250 237 263 225 289 225 L314 230 M521 231 C557 227 581 241 611 240 C644 239 666 224 693 224 C729 225 749 236 780 231\"/> <path data-start=\"1960\" data-duration=\"300\" data-phase=\"bank-echo\" stroke-width=\".85\" d=\"M82 284 C113 276 132 260 157 260 M182 267 C201 269 215 266 231 262 M256 247 C269 241 284 240 295 241 M554 249 C578 255 594 259 616 257 M649 249 C674 242 689 243 708 247\"/> <path data-start=\"2180\" data-duration=\"350\" data-phase=\"water-response\" stroke-width=\".85\" d=\"M265 288 C294 286 312 279 331 274 M359 259 C386 253 409 254 430 258 M471 273 C502 277 518 275 538 270\"/> <path data-start=\"2420\" data-duration=\"380\" data-phase=\"water-response\" stroke-width=\".8\" d=\"M314 310 C352 302 373 298 400 301 M427 318 C454 320 474 315 494 313 M540 300 C562 297 581 295 603 298\"/> <path data-start=\"2300\" data-duration=\"320\" data-phase=\"water-response\" stroke-width=\".75\" d=\"M382 225 C394 223 406 223 417 225 M345 243 C353 240 363 239 370 239 M447 239 C459 242 469 243 480 242\"/> <path data-start=\"1840\" data-duration=\"380\" data-phase=\"growing-tree\" stroke-width=\"1.05\" d=\"M173 212 C174 199 172 180 176 164 M177 183 C165 177 158 170 156 160 M177 177 C190 173 197 164 198 155\"/> <path data-start=\"2220\" data-duration=\"330\" data-phase=\"growing-tree\" stroke-width=\".95\" d=\"M156 160 C146 163 138 157 141 148 C134 143 138 133 146 133 C147 123 158 121 164 128 C171 117 184 124 184 132 C196 125 205 134 201 142 C212 149 208 159 198 159\"/> <path data-start=\"2540\" data-duration=\"260\" data-phase=\"growing-tree\" stroke-width=\".7\" d=\"M149 146 C157 145 164 149 168 154 M181 140 C183 148 179 155 175 159\"/> <path data-start=\"100\" data-duration=\"350\" data-phase=\"lamp\" stroke-width=\".8\" d=\"M585 202 L585 162 M581 161 L589 161 M584 152 L584 148\"/> <path data-start=\"2200\" data-duration=\"230\" data-phase=\"river-stones\" stroke-width=\".8\" d=\"M220 234 C224 230 230 230 234 234 C233 238 224 238 220 234 M686 213 C691 210 696 212 698 215\"/> </g> <path data-start=\"0\" data-duration=\"260\" data-phase=\"spark\" data-appear=\"true\" d=\"M581 152 L589 152 L590 161 L580 161 Z\" fill=\"#bc9364\" fill-opacity=\".6\"/> </svg>", "reading": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 460\" fill=\"none\" role=\"img\" aria-labelledby=\"reading-title reading-desc\"> <title id=\"reading-title\">A river opening toward the stars</title> <desc id=\"reading-desc\">An original ink drawing of winding river banks, distant hills, and a few stars. The upper left is intentionally open.</desc> <g stroke=\"#323831\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <!-- The continuous foreground gesture is the first stroke, not a frame. --> <path data-start=\"0\" data-duration=\"1100\" data-phase=\"way-out\" stroke-width=\"1.8\" d=\"M38 413 C89 392 120 385 162 385 C207 385 226 395 265 391 C309 387 330 368 365 353 C407 335 449 333 487 319 C521 307 549 291 562 280 C575 269 568 264 548 258 C528 252 513 251 499 247\"/> <path data-start=\"900\" data-duration=\"850\" data-phase=\"way-out\" stroke-width=\"1.7\" d=\"M510 247 C537 250 562 251 582 258 C602 265 604 276 590 288 C572 304 548 314 539 326 C527 341 539 350 565 357 C598 365 638 366 677 371 C732 378 769 391 808 409 C846 426 885 437 951 435\"/> <!-- A low, irregular ridge; no geometric skyline. --> <path data-start=\"900\" data-duration=\"480\" data-phase=\"low-ridge\" stroke-width=\"1.5\" d=\"M387 247 C416 241 434 230 459 225 C481 221 488 212 504 210 C518 207 530 216 544 213 C556 210 568 203 581 204 C599 204 609 211 625 215\"/> <path data-start=\"1180\" data-duration=\"450\" data-phase=\"middle-mountain\" stroke-width=\"1.65\" d=\"M581 204 C599 194 614 181 629 177 C642 174 647 164 661 162 C674 160 684 168 694 171 C711 176 719 185 729 192\"/> <path data-start=\"1410\" data-duration=\"500\" data-phase=\"high-mountain\" stroke-width=\"1.9\" d=\"M699 218 C728 205 740 190 758 181 C770 175 778 160 791 154 C803 150 803 138 813 135 C820 133 825 143 833 143 C843 144 845 155 854 156 C864 158 870 176 884 184 C901 194 923 198 950 208\"/> <path data-start=\"1710\" data-duration=\"240\" data-phase=\"distant-ridge\" stroke-width=\"1.2\" d=\"M919 198 C932 189 940 181 950 179 C958 177 965 183 972 181\"/> <!-- Small landforms sit below the ridges, leaving the river unfilled. --> <path data-start=\"1370\" data-duration=\"340\" data-phase=\"open-ground\" stroke-width=\"1.1\" d=\"M566 241 C593 239 608 231 632 230 C650 230 665 236 681 235 C699 234 707 230 724 231\"/> <path data-start=\"1560\" data-duration=\"340\" data-phase=\"open-ground\" stroke-width=\"1.1\" d=\"M637 250 C668 246 688 246 710 240 C728 235 740 228 758 226 C782 222 808 228 829 226\"/> <path data-start=\"1790\" data-duration=\"360\" data-phase=\"open-ground\" stroke-width=\"1.15\" d=\"M727 265 C757 260 777 248 803 245 C827 243 850 249 870 247 C892 245 910 235 934 235 C948 235 961 240 978 240\"/> <!-- Sparse folds in the mountains, deliberately broken before the base. --> <path data-start=\"1380\" data-duration=\"200\" data-phase=\"low-folds\" stroke-width=\"0.9\" d=\"M505 217 C494 221 490 229 480 232\"/> <path data-start=\"1450\" data-duration=\"200\" data-phase=\"low-folds\" stroke-width=\"0.85\" d=\"M545 220 C553 222 559 222 566 225\"/> <path data-start=\"1410\" data-duration=\"180\" data-phase=\"low-folds\" stroke-width=\"0.8\" d=\"M442 237 C450 233 456 233 465 232\"/> <path data-start=\"1630\" data-duration=\"220\" data-phase=\"middle-folds\" stroke-width=\"1\" d=\"M660 170 C651 178 649 189 640 194 C633 199 627 199 623 204\"/> <path data-start=\"1740\" data-duration=\"180\" data-phase=\"middle-folds\" stroke-width=\"0.8\" d=\"M675 177 C682 185 690 189 697 192\"/> <path data-start=\"1910\" data-duration=\"220\" data-phase=\"high-folds\" stroke-width=\"1.05\" d=\"M813 145 C809 158 801 161 798 173 C795 181 786 190 784 198\"/> <path data-start=\"2010\" data-duration=\"180\" data-phase=\"high-folds\" stroke-width=\"0.85\" d=\"M827 155 C828 166 837 172 840 185\"/> <path data-start=\"2080\" data-duration=\"160\" data-phase=\"high-folds\" stroke-width=\"0.75\" d=\"M851 167 C855 179 859 183 868 188\"/> <!-- The near bank carries a few hand-drawn strata, not a regular texture. --> <path data-start=\"420\" data-duration=\"430\" data-phase=\"near-bank\" stroke-width=\"0.95\" d=\"M70 425 C118 409 143 406 175 408 C203 410 224 417 246 416\"/> <path data-start=\"620\" data-duration=\"430\" data-phase=\"near-bank\" stroke-width=\"0.85\" d=\"M277 405 C302 401 320 390 343 381 C365 372 386 371 409 363\"/> <path data-start=\"830\" data-duration=\"300\" data-phase=\"near-bank\" stroke-width=\"0.85\" d=\"M342 365 C360 353 374 350 390 344\"/> <path data-start=\"940\" data-duration=\"300\" data-phase=\"near-bank\" stroke-width=\"0.8\" d=\"M422 344 C448 338 470 334 493 324\"/> <path data-start=\"1060\" data-duration=\"240\" data-phase=\"near-bank\" stroke-width=\"0.75\" d=\"M507 308 C526 299 536 292 542 286\"/> <path data-start=\"1300\" data-duration=\"260\" data-phase=\"return-bank\" stroke-width=\"0.9\" d=\"M554 342 C576 350 596 351 623 354\"/> <path data-start=\"1450\" data-duration=\"330\" data-phase=\"return-bank\" stroke-width=\"1\" d=\"M643 359 C695 363 726 371 752 382\"/> <path data-start=\"1620\" data-duration=\"250\" data-phase=\"return-bank\" stroke-width=\"0.8\" d=\"M786 395 C815 409 835 415 855 418\"/> <path data-start=\"1730\" data-duration=\"220\" data-phase=\"return-bank\" stroke-width=\"0.8\" d=\"M887 427 C910 431 927 430 941 430\"/> <!-- A restrained set of ripples gives the open channel its scale. --> <path data-start=\"1350\" data-duration=\"220\" data-phase=\"river-ripples\" stroke-width=\"0.75\" d=\"M568 295 C575 292 581 288 583 286\"/> <path data-start=\"1430\" data-duration=\"250\" data-phase=\"river-ripples\" stroke-width=\"0.8\" d=\"M512 333 C502 337 492 339 476 340\"/> <path data-start=\"1510\" data-duration=\"250\" data-phase=\"river-ripples\" stroke-width=\"0.75\" d=\"M469 355 C489 350 509 348 526 349\"/> <path data-start=\"1590\" data-duration=\"250\" data-phase=\"river-ripples\" stroke-width=\"0.9\" d=\"M427 375 C447 370 460 370 470 369\"/> <path data-start=\"1670\" data-duration=\"240\" data-phase=\"river-ripples\" stroke-width=\"0.8\" d=\"M512 380 C535 378 550 379 565 382\"/> <path data-start=\"1750\" data-duration=\"280\" data-phase=\"river-ripples\" stroke-width=\"0.85\" d=\"M362 409 C395 402 417 400 440 401\"/> <path data-start=\"1840\" data-duration=\"220\" data-phase=\"river-ripples\" stroke-width=\"0.75\" d=\"M475 418 C490 415 508 415 520 416\"/> <path data-start=\"1920\" data-duration=\"280\" data-phase=\"river-ripples\" stroke-width=\"0.9\" d=\"M599 409 C631 409 655 412 679 418\"/> <!-- Two tiny irregular stones, kept apart from the large gestures. --> <path data-start=\"1600\" data-duration=\"180\" data-phase=\"river-stones\" stroke-width=\"0.9\" d=\"M307 380 C311 376 316 375 319 378 C320 381 312 383 307 380\"/> <path data-start=\"1840\" data-duration=\"180\" data-phase=\"river-stones\" stroke-width=\"0.85\" d=\"M693 358 C697 355 703 356 707 359 C703 361 697 361 693 358\"/> <!-- Stars arrive last and stay still. No twinkling loop. --> <g data-stars=\"true\" stroke=\"#686e62\"> <path data-start=\"2300\" data-duration=\"260\" data-phase=\"stars\" stroke-width=\"1.05\" d=\"M688 51 C688 55 687 59 687 63 M682 57 C685 58 690 58 694 57\"/> <path data-start=\"2440\" data-duration=\"260\" data-phase=\"stars\" stroke-width=\"0.85\" d=\"M894 80 C893 83 894 87 894 89 M889 85 C892 84 897 84 899 85\"/> <path data-start=\"2560\" data-duration=\"160\" data-phase=\"stars\" stroke-width=\"1.7\" d=\"M751 93 L751.3 93.4\"/> <path data-start=\"2490\" data-duration=\"180\" data-phase=\"stars\" stroke-width=\"1.65\" d=\"M826 62 L826.25 62.4\"/> <path data-start=\"2530\" data-duration=\"170\" data-phase=\"stars\" stroke-width=\"1.4\" d=\"M603 108 L603.2 108.25\"/> <path data-start=\"2590\" data-duration=\"180\" data-phase=\"stars\" stroke-width=\"1.45\" d=\"M936 122 L936.2 122.35\"/> <path data-start=\"2620\" data-duration=\"180\" data-phase=\"stars\" stroke-width=\"1.4\" d=\"M717 125 L717.25 125.2\"/> </g> </g> </svg>", "arrival": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 650\" fill=\"none\" role=\"img\" aria-labelledby=\"arrival-title arrival-desc\"> <title id=\"arrival-title\">A city between the river and the stars</title> <desc id=\"arrival-desc\">Original ink landscape: a river opens through layered terrain, a small imagined city rests on its bank, and a few stars appear above it.</desc> <g stroke=\"#40463e\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path data-start=\"0\" data-duration=\"650\" data-phase=\"river\" stroke-width=\"1.75\" d=\"M28 552 C109 518 177 529 237 510 C299 490 327 449 392 446 C455 443 478 468 527 454 C575 440 591 404 642 397 C689 390 733 406 770 393 C804 381 812 365 841 357\"/> <path data-start=\"180\" data-duration=\"650\" data-phase=\"river\" stroke-width=\"1.6\" d=\"M51 594 C128 558 187 575 258 551 C324 529 349 487 407 485 C468 483 492 506 545 488 C599 470 615 437 665 434 C711 431 742 447 781 434 C815 423 832 402 858 393 C888 383 906 383 933 389\"/> <path data-start=\"520\" data-duration=\"380\" data-phase=\"river\" stroke-width=\"1.45\" d=\"M839 357 C812 351 785 351 774 339 C766 328 785 318 814 304 C837 293 853 283 857 272\"/> <path data-start=\"580\" data-duration=\"360\" data-phase=\"river\" stroke-width=\"1.4\" d=\"M865 276 C862 294 840 307 827 319 C815 330 826 341 856 346 C892 351 929 346 964 354 C1000 362 1025 387 1060 397 C1097 408 1126 409 1170 403\"/> <path data-start=\"660\" data-duration=\"400\" data-phase=\"land\" stroke-width=\".85\" d=\"M45 516 C104 491 166 502 217 485 C268 468 289 440 324 428 M72 485 C122 468 159 478 199 468 M136 444 C186 438 225 449 257 430\"/> <path data-start=\"720\" data-duration=\"400\" data-phase=\"land\" stroke-width=\".8\" d=\"M277 402 C316 385 348 391 382 382 C417 373 433 352 462 346 M314 418 C346 404 374 411 397 401 M416 421 C449 419 467 433 490 431\"/> <path data-start=\"800\" data-duration=\"420\" data-phase=\"land\" stroke-width=\".9\" d=\"M493 412 C521 400 536 378 561 371 C585 364 601 368 621 359 C643 348 652 332 672 325 C693 319 713 321 734 309\"/> <path data-start=\"900\" data-duration=\"350\" data-phase=\"land\" stroke-width=\".75\" d=\"M537 414 C566 398 583 389 606 389 M632 376 C650 367 664 349 682 346 M711 337 C730 333 742 324 756 319\"/> <path data-start=\"900\" data-duration=\"350\" data-phase=\"land\" stroke-width=\".85\" d=\"M90 609 C133 590 175 602 214 589 M264 576 C309 561 335 526 370 518 M409 517 C443 516 464 534 492 527 M525 519 C562 511 576 490 599 479\"/> <path data-start=\"970\" data-duration=\"320\" data-phase=\"land\" stroke-width=\".8\" d=\"M636 470 C668 461 695 467 714 470 M750 472 C784 471 805 456 829 448 M858 432 C883 420 903 417 928 421\"/> <path data-start=\"1030\" data-duration=\"320\" data-phase=\"land\" stroke-width=\".7\" d=\"M559 549 C594 535 615 514 642 507 C675 498 699 508 727 505 M786 511 C814 500 832 481 855 476 M892 469 C921 465 947 476 970 472\"/> <path data-start=\"1080\" data-duration=\"300\" data-phase=\"land\" stroke-width=\".75\" d=\"M324 478 C342 465 359 459 378 458 M416 461 C438 462 453 469 468 468 M577 435 C593 426 606 416 623 413 M688 411 C706 414 721 418 736 415\"/> <path data-start=\"1130\" data-duration=\"300\" data-phase=\"land\" stroke-width=\".7\" d=\"M790 368 C804 369 816 366 825 364 M847 316 C854 311 860 305 863 299 M911 364 C931 361 947 366 961 369 M1000 394 C1020 408 1035 416 1053 419\"/> <path data-start=\"1400\" data-duration=\"330\" data-phase=\"city\" stroke-width=\"1.2\" d=\"M888 346 L886 286 L910 273 L939 286 L940 349 M886 286 L915 299 L939 286 M915 299 L916 348\"/> <path data-start=\"1450\" data-duration=\"330\" data-phase=\"city\" stroke-width=\"1.15\" d=\"M944 353 L944 308 L966 298 L988 308 L989 365 M944 308 L967 319 L988 308 M967 319 L969 358\"/> <path data-start=\"1500\" data-duration=\"330\" data-phase=\"city\" stroke-width=\"1.2\" d=\"M998 374 L997 278 L1015 265 L1036 278 L1038 393 M997 278 L1017 287 L1036 278 M1017 287 L1019 383\"/> <path data-start=\"1550\" data-duration=\"330\" data-phase=\"city\" stroke-width=\"1.1\" d=\"M1046 394 L1045 334 L1067 323 L1092 335 L1093 405 M1045 334 L1070 346 L1092 335 M1070 346 L1071 402\"/> <path data-start=\"1600\" data-duration=\"330\" data-phase=\"city\" stroke-width=\"1\" d=\"M1101 407 L1101 373 L1118 364 L1137 373 L1137 408 M1101 373 L1120 382 L1137 373 M1120 382 L1120 409\"/> <path data-start=\"1740\" data-duration=\"220\" data-phase=\"city-detail\" stroke-width=\".7\" d=\"M894 302 L905 307 M894 315 L905 320 M894 329 L905 334 M922 304 L932 300 M922 318 L932 314 M922 332 L932 328\"/> <path data-start=\"1790\" data-duration=\"200\" data-phase=\"city-detail\" stroke-width=\".7\" d=\"M952 324 L960 328 M952 338 L960 342 M974 325 L982 322 M975 340 L983 337\"/> <path data-start=\"1840\" data-duration=\"190\" data-phase=\"city-detail\" stroke-width=\".7\" d=\"M1004 294 L1011 297 M1004 310 L1011 313 M1005 327 L1012 330 M1005 344 L1012 347 M1006 360 L1013 363 M1024 296 L1030 293 M1024 312 L1030 309 M1025 329 L1031 326 M1025 346 L1031 343 M1026 362 L1032 359\"/> <path data-start=\"1890\" data-duration=\"140\" data-phase=\"city-detail\" stroke-width=\".7\" d=\"M1054 352 L1063 356 M1054 367 L1063 371 M1055 383 L1064 387 M1077 352 L1085 348 M1077 367 L1085 363 M1078 383 L1086 379 M1108 386 L1114 389 M1126 386 L1131 384\"/> <path data-start=\"1150\" data-duration=\"300\" data-phase=\"land\" stroke-width=\".95\" d=\"M743 387 L744 363 M744 375 C733 374 730 365 735 360 C729 353 736 342 744 345 C750 337 759 342 758 349 C768 350 768 361 761 365 C766 374 754 379 748 373\"/> <path data-start=\"1200\" data-duration=\"250\" data-phase=\"land\" stroke-width=\".8\" d=\"M1151 406 L1152 386 M1150 393 C1142 394 1139 386 1144 382 C1141 374 1150 370 1155 375 C1163 373 1167 382 1162 386 C1164 392 1158 395 1154 391\"/> <path data-start=\"1010\" data-duration=\"360\" data-phase=\"land\" stroke-width=\".85\" d=\"M873 260 C895 251 911 237 931 234 C951 231 965 239 982 233 C1003 225 1016 210 1037 210 C1062 211 1079 225 1100 223 C1128 221 1144 211 1171 213\"/> <path data-start=\"1200\" data-duration=\"250\" data-phase=\"land\" stroke-width=\".65\" d=\"M897 267 C916 262 929 251 945 252 M971 257 C994 254 1008 239 1026 237 M1060 242 C1087 252 1112 245 1131 242\"/> <path data-start=\"1150\" data-duration=\"300\" data-phase=\"land\" stroke-width=\".65\" d=\"M573 583 C613 571 640 573 671 579 M734 556 C766 554 783 560 803 557 M860 529 C881 526 899 531 917 534\"/> </g> <g data-stars=\"true\" stroke=\"#8d795b\" stroke-linecap=\"round\"> <path data-start=\"2360\" data-duration=\"300\" data-phase=\"stars\" stroke-width=\"1.15\" d=\"M902 125 L902 138 M896 131 L908 131\"/> <path data-start=\"2400\" data-duration=\"300\" data-phase=\"stars\" stroke-width=\".95\" d=\"M1104 99 L1104 108 M1100 103 L1108 103\"/> <path data-start=\"2450\" data-duration=\"280\" data-phase=\"stars\" stroke-width=\"1.8\" d=\"M1014 160 L1014.2 160.3\"/> <path data-start=\"2490\" data-duration=\"270\" data-phase=\"stars\" stroke-width=\"1.5\" d=\"M967 75 L967.2 75.3\"/> <path data-start=\"2520\" data-duration=\"260\" data-phase=\"stars\" stroke-width=\"1.4\" d=\"M1161 167 L1161.2 167.3\"/> <path data-start=\"2540\" data-duration=\"260\" data-phase=\"stars\" stroke-width=\"1.4\" d=\"M837 182 L837.2 182.3\"/> </g> <g fill=\"#b49261\" fill-opacity=\".48\"> <path data-start=\"2040\" data-duration=\"300\" data-phase=\"windows\" data-appear=\"true\" d=\"M1024 312 L1030 309 L1030 317 L1024 320 Z\"/> <path data-start=\"2070\" data-duration=\"270\" data-phase=\"windows\" data-appear=\"true\" d=\"M1054 367 L1063 371 L1063 379 L1054 375 Z\"/> </g> </svg>"};
  const copy = {"writing": {"original": "Was bleibet aber, stiften die Dichter.", "source": "https://ausstellungen.deutsche-digitale-bibliothek.de/aufbrueche-abbrueche-hoelderlin", "zh": ["然而，长存之物，", "由诗人创立。", "荷尔德林 ·《纪念》"], "en": ["Yet what endures", "is founded by poets.", "Hölderlin · Andenken"], "ja": ["しかし、長く残るものを", "詩人たちが築く。", "ヘルダーリン ·『追想』"]}, "research": {"original": "Willst du ins Unendliche schreiten, / Geh nur im Endlichen nach allen Seiten.", "source": "https://projekt-gutenberg.org/authors/johann-wolfgang-von-goethe/books/gedichte-ausgabe-letzter-hand/chapter/256/", "zh": ["若要走向无限，", "就向有限的各个方向探寻。", "歌德 · Gott, Gemüt und Welt"], "en": ["To venture into the infinite,", "explore the finite in every direction.", "Goethe · Gott, Gemüt und Welt"], "ja": ["無限へ歩もうとするなら、", "有限をあらゆる方角へ探れ。", "ゲーテ · Gott, Gemüt und Welt"]}, "projects": {"original": "Poca favilla gran fiamma seconda.", "source": "https://dante.princeton.edu/cgi-bin/dante/campuscgi/mpb/GetCantoSection.pl?INP_LEN=15&INP_POEM=Par&INP_SECT=1&INP_START=33&LANG=2", "zh": ["微小的火星，", "也能引出大火。", "但丁 ·《天堂篇》1.34"], "en": ["A little spark", "can kindle a great flame.", "Dante · Paradiso I, 34"], "ja": ["小さな火花から、", "大きな炎が生まれる。", "ダンテ ·『神曲』天国篇 1.34"]}, "reading": {"original": "E quindi uscimmo a riveder le stelle.", "source": "https://www.treccani.it/enciclopedia/rivedere_%28Enciclopedia-Dantesca%29/", "zh": ["于是我们走出，", "重见群星。", "但丁 ·《地狱篇》34.139"], "en": ["And so we emerged", "to see the stars again.", "Dante · Inferno XXXIV, 139"], "ja": ["そして外へ出て、", "再び星を見た。", "ダンテ ·『神曲』地獄篇 34.139"]}, "arrival": {"original": "Hold infinity in the palm of your hand / And eternity in an hour.", "source": "https://www.poetryfoundation.org/poems/43650/auguries-of-innocence", "en": ["Hold infinity", "in the palm of your hand", "And eternity in an hour.", "William Blake · Auguries of Innocence"], "zh": ["把无限握在掌心，", "将永恒凝于一瞬。", "威廉·布莱克 ·《天真的预言》"], "ja": ["無限をその掌に、", "永遠をひとときに。", "ウィリアム・ブレイク · Auguries of Innocence"]}};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width:650px)');
  const states = new Map();
  const watchedParents = new WeakSet();
  const ALIGN_MS = 320, DRAW_MS = 2800, MAX_HOLD_MS = 4000;
  let resizeFrame = 0, scrollFrame = 0, active = null, lastRelease = null;
  let intentUntil = 0, intentDirection = 0, suppressUntil = 0, touch = null;
  let initialChecked = false, lastScrollY = scrollY, serial = 0;
  const esc = value => value.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const now = () => performance.now();
  const viewport = () => document.documentElement.clientHeight;
  const rectVisible = element => element.isConnected && element.getClientRects().length && !element.closest('[hidden]');
  const canMove = () => !reduced.matches && !document.hidden && !!Element.prototype.animate && (window.visualViewport?.scale || 1) < 1.03;
  function finish(state) {
    state.generation++;
    state.element.removeAttribute('data-poetic-started-at');
    state.animations.forEach(animation => animation.cancel());
    state.animations = [];
    state.paths.forEach(path => {
      path.style.removeProperty('stroke-dasharray');
      path.style.removeProperty('stroke-dashoffset');
      path.style.removeProperty('opacity');
    });
    state.element.dataset.poeticState = 'complete';
    state.started = true;
  }
  function release(reason = 'complete') {
    if (!active) return;
    const hold = active;
    active = null;
    cancelAnimationFrame(hold.frame);
    clearTimeout(hold.watchdog);
    document.documentElement.removeAttribute('data-poetic-hold');
    hold.state.element.removeAttribute('data-poetic-hold');
    finish(hold.state);
    lastRelease = {scene:hold.state.name, reason, elapsed:Math.round(now()-hold.started)};
    // Once visited, this scene does not capture ordinary scrolling again.
    hold.state.armed = false;
  }
  function draw(state, completed) {
    finish(state);
    state.started = true;
    state.armed = false;
    if (!canMove()) { completed?.(); return; }
    const generation = state.generation;
    state.cycles++;
    state.element.dataset.poeticCycle = String(state.cycles);
    state.element.dataset.poeticState = 'drawing';
    const timings = state.paths.map((path,index) => {
      // Every drawing encodes semantic phases; DOM order does not determine the story.
      return {path,appear:path.closest('[data-stars]') || path.hasAttribute('data-appear'),
        delay:Number(path.dataset.start || 0),
        duration:Number(path.dataset.duration || 600)};
    });
    const scale = DRAW_MS / Math.max(...timings.map(t=>t.delay+t.duration));
    try {
      timings.forEach(({path,appear,delay,duration}) => {
        let frames;
        if (appear) { path.style.opacity='0'; frames=[{opacity:0},{opacity:1}]; }
        else {
          const length = path.getTotalLength()+1;
          path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length);
          frames=[{strokeDashoffset:length},{strokeDashoffset:0}];
        }
        state.animations.push(path.animate(frames,{delay:delay*scale,duration:duration*scale,easing:appear?'ease-out':'linear',fill:'both'}));
      });
      const start = document.timeline.currentTime;
      if(start!==null){
        state.animations.forEach(animation=>{animation.startTime=start;});
        // Independent decorative layers can follow this timeline without joining its completion gate.
        state.element.dataset.poeticStartedAt=String(start);
        state.element.dataset.poeticDuration=String(DRAW_MS);
      }
      Promise.all(state.animations.map(animation=>animation.finished)).then(()=>{
        if(state.generation!==generation)return;
        finish(state);completed?.();
      },()=>{});
    } catch (_) { finish(state);if(active?.state===state)release('animation-error');completed?.(); }
  }
  function syncLibraryVisibility() {
    const index = document.getElementById('library-index');
    if (!index) return;
    states.forEach(state => {
      if (!state.element.classList.contains('poetic-library-opening')) return;
      if (state.element.hidden !== index.hidden) state.element.hidden=index.hidden;
    });
  }
  const visibilityObserver = new MutationObserver(() => {
    syncLibraryVisibility();
    if(active && !rectVisible(active.state.element))release('hidden');
    cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);
  });
  function watchHidden(element) {
    if (!element || watchedParents.has(element)) return;
    watchedParents.add(element);
    visibilityObserver.observe(element,{attributes:true,attributeFilter:['hidden']});
  }
  function eligible(state) {
    if(!state.armed || !rectVisible(state.element))return false;
    const rect=state.element.getBoundingClientRect();
    return rect.height>=viewport()*.65 && rect.width>=document.documentElement.clientWidth*.65;
  }
  function candidate(direction,delta=0) {
    const height=viewport(),reach=Math.max(height*.42,Math.abs(delta));
    return [...states.values()].filter(eligible).map(state=>({state,rect:state.element.getBoundingClientRect()}))
      .filter(({rect})=>direction>0 ? rect.top>=-height*.13 && rect.top<=reach : rect.bottom<=height*1.13 && rect.bottom>=height-reach)
      .sort((a,b)=>direction>0?a.rect.top-b.rect.top:b.rect.bottom-a.rect.bottom)[0]?.state;
  }
  function beginHold(state,direction=1,immediate=false) {
    if(active || !canMove() || now()<suppressUntil || !rectVisible(state.element))return false;
    try {
      const rect=state.element.getBoundingClientRect();
      const target=Math.max(0,Math.min(scrollY+rect.top,document.documentElement.scrollHeight-viewport()));
      const hold={id:++serial,state,direction,target,phase:'aligning',started:now(),frame:0,watchdog:0};
      active=hold;state.armed=false;
      document.documentElement.dataset.poeticHold=state.name;state.element.dataset.poeticHold='aligning';
      state.element.dataset.poeticState='aligning';
      hold.watchdog=setTimeout(()=>{if(active===hold)release('timeout');},MAX_HOLD_MS);
      const startY=scrollY,start=now(),duration=immediate?0:ALIGN_MS;
      const completeAlignment=()=>{
        if(active!==hold)return;
        scrollTo({top:target,behavior:'instant'});
        hold.phase='drawing';state.element.dataset.poeticHold='drawing';
        draw(state,()=>{if(active===hold)release('complete');});
      };
      const align=time=>{
        if(active!==hold)return;
        if(!canMove() || !rectVisible(state.element)){release('unavailable');return;}
        const progress=duration?Math.min(1,(time-start)/duration):1;
        scrollTo({top:startY+(target-startY)*(1-Math.pow(1-progress,3)),behavior:'instant'});
        if(progress<1)hold.frame=requestAnimationFrame(align);else completeAlignment();
      };
      hold.frame=requestAnimationFrame(align);
      return true;
    } catch (_) { release('alignment-error');return false; }
  }
  function interactive(target) {
    return target instanceof Element && !!target.closest('input,textarea,select,button,[contenteditable="true"],[role="slider"],[role="textbox"],[data-poetic-skip]');
  }
  function nestedScroller(target) {
    for(let element=target instanceof Element?target:null;element && element!==document.body;element=element.parentElement){
      const style=getComputedStyle(element);
      if(/auto|scroll/.test(style.overflowY) && element.scrollHeight>element.clientHeight+2)return true;
    }
    return false;
  }
  function consume(event,direction,delta) {
    if(!direction || !canMove() || interactive(event.target) || nestedScroller(event.target))return false;
    if(active){
      if(direction!==active.direction){release('reverse');return false;}
      if(event.cancelable)event.preventDefault();return true;
    }
    if(now()<suppressUntil)return false;
    intentDirection=direction;intentUntil=now()+700;
    const next=candidate(direction,delta);
    if(next && beginHold(next,direction)){
      if(event.cancelable)event.preventDefault();return true;
    }
    return false;
  }
  window.addEventListener('wheel',event=>{
    if(event.ctrlKey || event.metaKey){release('zoom');return;}
    if(Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    const delta=event.deltaY*(event.deltaMode===1?18:event.deltaMode===2?viewport():1);
    consume(event,Math.sign(delta),delta);
  },{passive:false,capture:true});
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'){release('escape');return;}
    if(event.ctrlKey || event.metaKey || event.altKey || interactive(event.target) || event.target.closest?.('a'))return;
    const directions={ArrowDown:1,PageDown:1,' ':event.shiftKey?-1:1,ArrowUp:-1,PageUp:-1};
    if(event.key==='Home' || event.key==='End'){skipNavigation();return;}
    const direction=directions[event.key];
    if(direction)consume(event,direction,direction*(event.key.startsWith('Arrow')?70:viewport()*.9));
  },{capture:true});
  window.addEventListener('touchstart',event=>{
    if(event.touches.length!==1){touch=null;release('pinch');return;}
    const point=event.touches[0];touch={y:point.clientY,x:point.clientX,originX:point.clientX,originY:point.clientY,target:event.target,skip:interactive(event.target)||nestedScroller(event.target)};
  },{passive:true,capture:true});
  window.addEventListener('touchmove',event=>{
    if(!touch || event.touches.length!==1){release('pinch');return;}
    if(touch.skip)return;
    const point=event.touches[0],delta=touch.y-point.clientY;
    const horizontal=Math.abs(point.clientX-touch.originX)>Math.abs(point.clientY-touch.originY);
    touch.y=point.clientY;touch.x=point.clientX;
    if(horizontal || Math.abs(delta)<2)return;
    consume(event,Math.sign(delta),delta);
  },{passive:false,capture:true});
  window.addEventListener('touchend',()=>{
    if(touch && !touch.skip && intentDirection)intentUntil=now()+1400;
    touch=null;
  },{passive:true,capture:true});
  window.addEventListener('touchcancel',()=>{touch=null;release('touch-cancel');},{passive:true});
  function skipNavigation() {
    suppressUntil=now()+1200;intentUntil=0;release('navigation');
  }
  function chapterNavigation(event) {
    if(event.defaultPrevented || event.button>0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return false;
    const link=event.target.closest?.('.site-nav a[data-site-link]');
    if(!link || link.target==='_blank' || !document.querySelector('[data-poetic-scene="arrival"]'))return false;
    let url;try{url=new URL(link.href,location.href);}catch(_){return false;}
    if(url.origin!==location.origin || url.pathname!==location.pathname || !['#writing','#research','#projects'].includes(url.hash))return false;
    const section=document.getElementById(url.hash.slice(1));
    const element=section?.matches('[data-poetic-scene]')?section:section?.querySelector('[data-poetic-scene]');
    const state=states.get(element);if(!state)return false;
    event.preventDefault();
    release('chapter-navigation');intentUntil=0;suppressUntil=0;
    for(let parent=section;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
    // pushState retains Back/Forward semantics without firing minimal.js's hashchange
    // revealAnchor handler, which otherwise competes with the scene alignment.
    try{if(url.href!==location.href)history.pushState(history.state,'',url.pathname+url.search+url.hash);}catch(_){}
    const top=scrollY+element.getBoundingClientRect().top,direction=Math.sign(top-scrollY)||1;
    if(!beginHold(state,direction)){
      scrollTo({top,behavior:'instant'});finish(state);
    }
    return true;
  }
  document.addEventListener('click',event=>{
    if(chapterNavigation(event))return;
    const link=event.target.closest?.('a,[data-back],[data-read],[data-note],[data-book],[data-collection],[data-lang]');
    if(link)skipNavigation();
  },{capture:true});
  window.addEventListener('hashchange',skipNavigation);
  window.addEventListener('popstate',skipNavigation);
  function scrollChanged() {
    scrollFrame=0;
    const position=scrollY,direction=Math.sign(position-lastScrollY);lastScrollY=position;
    if(active){
      if(active.phase==='drawing' && Math.abs(scrollY-active.target)>1)scrollTo({top:active.target,behavior:'instant'});
      return;
    }
    const height=viewport();
    states.forEach(state=>{
      if(!rectVisible(state.element))return;
      const rect=state.element.getBoundingClientRect();
      if(rect.bottom<-12 || rect.top>height+12){
        if(state.animations.length)finish(state);
        // A completed scene remains read during this page visit. Explicit navigation can replay it.
        if(state.started)state.armed=false;
      }
    });
    // Native touch inertia can cross a scene after the finger has left the glass.
    if(direction && now()<intentUntil && now()>=suppressUntil && canMove()){
      const next=candidate(intentDirection || direction,0);
      if(next)beginHold(next,intentDirection || direction);
    }
  }
  window.addEventListener('scroll',()=>{
    if(active?.phase==='drawing' && Math.abs(scrollY-active.target)>1)scrollTo({top:active.target,behavior:'instant'});
    if(!scrollFrame)scrollFrame=requestAnimationFrame(scrollChanged);
  },{passive:true});
  const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const state=states.get(entry.target);
      if(!state || active)return;
      if(!initialChecked)return;
      if(entry.intersectionRatio>=.68 && !state.started){
        // Programmatic/history/anchor arrival may draw, but must never capture scrolling.
        if(now()>=intentUntil || now()<suppressUntil)draw(state);
      }else if(!entry.isIntersecting){
        if(state.animations.length)finish(state);
        // A completed scene remains read during this page visit. Explicit navigation can replay it.
        if(state.started)state.armed=false;
      }
    });
  },{threshold:[0,.68]}) : null;
  function checkInitial() {
    if(initialChecked)return;
    initialChecked=true;
    const params=new URLSearchParams(location.search);
    const restored=performance.getEntriesByType('navigation')[0]?.type==='back_forward';
    const skip=location.hash || restored || scrollY>8 || params.has('resume') || params.has('report') || params.has('note') || Number(params.get('page')||1)>1;
    const first=[...states.values()].find(state=>{
      if(!rectVisible(state.element))return false;
      const rect=state.element.getBoundingClientRect();return Math.abs(rect.top)<8 && rect.height>=viewport()*.8;
    });
    if(first && canMove() && !skip && beginHold(first,1,true))return;
    states.forEach(state=>{
      if(!rectVisible(state.element) || state.started)return;
      const rect=state.element.getBoundingClientRect();
      if(Math.min(rect.bottom,viewport())-Math.max(rect.top,0)>=rect.height*.68)draw(state);
    });
  }
  function mount(root=document) {
    const candidates=[...root.querySelectorAll('[data-poetic-scene]')];
    if(root.matches?.('[data-poetic-scene]'))candidates.unshift(root);
    candidates.forEach(element=>{
      if(states.has(element))return;
      const name=element.dataset.poeticScene;if(!drawings[name])return;
      const text=copy[name];
      if(!element.querySelector('.poetic-copy')){
        const block=document.createElement('div');block.className='poetic-copy';
        if(name==='arrival')block.classList.add('poetic-arrival-copy');
        block.innerHTML='<blockquote>'+['en','zh','ja'].map(lang=>'<span lang="'+lang+'">'+text[lang].slice(0,-1).map(esc).join('<br>')+'</span>').join('')+'</blockquote><cite><a target="_blank" rel="noopener" href="'+esc(text.source)+'" title="'+esc(text.original)+'">'+['en','zh','ja'].map(lang=>'<span lang="'+lang+'">'+esc(text[lang].at(-1))+'</span>').join('')+'</a></cite>';
        element.prepend(block);
      }
      let art=element.querySelector('.poetic-art');
      if(!art){art=document.createElement('div');art.className='poetic-art';element.append(art);}
      art.setAttribute('aria-hidden','true');art.innerHTML=drawings[name];
      const svg=art.querySelector('svg');svg.removeAttribute('role');svg.removeAttribute('aria-labelledby');svg.querySelectorAll('title,desc').forEach(el=>el.remove());svg.setAttribute('focusable','false');
      const wideBox=svg.getAttribute('viewBox');
      const mobileBoxes={arrival:'250 70 940 570',reading:'330 20 660 430',writing:'100 95 700 245',research:'100 75 690 270',projects:'115 105 600 230'};
      const updateFrame=()=>svg.setAttribute('viewBox',narrow.matches?mobileBoxes[name]:wideBox);updateFrame();
      const state={element,name,updateFrame,paths:[...svg.querySelectorAll('path')],animations:[],started:false,armed:true,generation:0,cycles:0};
      states.set(element,state);
      for(let ancestor=element;ancestor;ancestor=ancestor.parentElement)watchHidden(ancestor);
      if(element.classList.contains('poetic-library-opening'))watchHidden(document.getElementById('library-index'));
      if(reduced.matches)finish(state);else if(observer)observer.observe(element);else draw(state);
    });
    syncLibraryVisibility();resize();
    requestAnimationFrame(()=>requestAnimationFrame(checkInitial));
  }
  function resize() {
    const width=document.documentElement.clientWidth;
    states.forEach(({element})=>{
      element.style.setProperty('--poetic-viewport-width',width+'px');
      element.style.marginLeft='0px';element.style.marginRight='0px';
      const opening=element.classList.contains('poetic-opening');
      if(opening)element.style.marginTop='0px';
      const left=element.getBoundingClientRect().left;element.style.marginLeft=-left+'px';
      if(opening){const top=element.getBoundingClientRect().top+scrollY;if(top>=0 && top<240)element.style.marginTop=-top+'px';}
    });
  }
  function getState() {
    return {holding:!!active,scene:active?.state.name || null,phase:active?.phase || 'idle',elapsed:active?Math.round(now()-active.started):0,lastRelease,
      scenes:[...states.values()].map(state=>({scene:state.name,state:state.element.dataset.poeticState,armed:state.armed,cycles:state.cycles,animations:state.animations.length,visible:!!rectVisible(state.element)}))};
  }
  window.PoeticChapters={mount,getState,release};
  window.addEventListener('resize',()=>{
    release('resize');states.forEach(state=>{if(state.animations.length)finish(state);});
    cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);
  },{passive:true});
  window.visualViewport?.addEventListener('resize',()=>{if((visualViewport.scale||1)>1.03)release('zoom');},{passive:true});
  reduced.addEventListener('change',event=>{if(event.matches){release('reduced-motion');states.forEach(finish);}});
  narrow.addEventListener('change',()=>states.forEach(state=>state.updateFrame()));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){release('hidden-tab');states.forEach(state=>{if(state.animations.length)finish(state);});}});
  window.addEventListener('pagehide',()=>{release('pagehide');states.forEach(finish);});
  window.addEventListener('beforeprint',()=>{release('print');states.forEach(finish);});
  window.addEventListener('error',()=>release('error'));
  mount();
})();
