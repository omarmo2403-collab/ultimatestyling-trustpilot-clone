// Script for OMQ Auto Parts Hub Trustpilot clone

document.addEventListener('DOMContentLoaded', () => {
    // ============== STICKY TAB NAV ==============
    const stickyTabnav = document.getElementById('stickyTabnav');
    const stickyTabs = document.querySelectorAll('.sticky-tab');
    const sections = ['summary', 'about', 'reviews']
        .map(id => ({ id, el: document.getElementById(id) }))
        .filter(s => s.el);

    if (stickyTabnav && sections.length) {
        // Always-displayed element; toggle the .visible class to slide in/out
        stickyTabnav.removeAttribute('hidden');

        const updateStickyState = () => {
            const shouldShow = window.scrollY > 240;
            stickyTabnav.classList.toggle('visible', shouldShow);

            // Determine the active section based on scroll position
            const viewportMid = window.scrollY + 120;
            let active = sections[0].id;
            for (const s of sections) {
                if (s.el.offsetTop <= viewportMid) active = s.id;
            }
            stickyTabs.forEach(t => {
                t.classList.toggle('active', t.dataset.section === active);
            });
        };

        // Smooth scroll on tab click, accounting for the sticky bar height
        stickyTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(tab.dataset.section);
                if (!target) return;
                const offset = 72;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            });
        });

        window.addEventListener('scroll', updateStickyState, { passive: true });
        updateStickyState();
    }

    // Integrity banner expand toggle
    const integrityHeader = document.querySelector('.integrity-header');
    const integrityContent = document.querySelector('.integrity-content');

    if (integrityHeader && integrityContent) {
        integrityHeader.addEventListener('click', () => {
            const isExpanded = integrityHeader.getAttribute('aria-expanded') === 'true';
            integrityHeader.setAttribute('aria-expanded', !isExpanded);
            integrityContent.hidden = isExpanded;

            const svg = integrityHeader.querySelector('.chevron-btn svg');
            if (svg) {
                svg.style.transform = !isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
                svg.style.transition = 'transform 0.2s ease';
            }
        });
    }

    // Thumb feedback
    document.querySelectorAll('.thumb-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.thumb-btn').forEach(b => b.style.color = '#6E7689');
            btn.style.color = '#1F3DAD';
        });
    });

    // Review summary expand/collapse
    const summaryBody = document.querySelector('.summary-body');
    if (summaryBody) {
        const collapsed = summaryBody.querySelector('.summary-collapsed');
        const expanded = summaryBody.querySelector('.summary-expanded');

        document.querySelectorAll('.summary-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const action = toggle.dataset.action;
                const expand = action === 'expand';
                summaryBody.dataset.expanded = String(expand);
                if (collapsed) collapsed.hidden = expand;
                if (expanded) expanded.hidden = !expand;
            });
        });
    }

    // Topics horizontal scroll
    const topicsScroll = document.querySelector('.topics-scroll');
    const topicsPrev = document.querySelector('.topics-nav-prev');
    const topicsNext = document.querySelector('.topics-nav-next');

    if (topicsScroll && topicsPrev && topicsNext) {
        const updateNavVisibility = () => {
            const { scrollLeft, scrollWidth, clientWidth } = topicsScroll;
            topicsPrev.hidden = scrollLeft <= 0;
            topicsNext.hidden = scrollLeft + clientWidth >= scrollWidth - 1;
        };

        topicsPrev.addEventListener('click', () => {
            topicsScroll.scrollBy({ left: -272, behavior: 'smooth' });
        });
        topicsNext.addEventListener('click', () => {
            topicsScroll.scrollBy({ left: 272, behavior: 'smooth' });
        });
        topicsScroll.addEventListener('scroll', updateNavVisibility);
        window.addEventListener('resize', updateNavVisibility);
        updateNavVisibility();
    }

    // ============== TOPIC DETAIL MODAL ==============
    const TOPIC_DATA = {
        product: {
            title: 'Product',
            summary: 'People report ambiguous experiences with product. Many customers praise the quality and perfect fit of parts, with several mentioning items being significantly cheaper than dealer alternatives. Reviewers highlight finding hard-to-source parts for older car models, with parts often working perfectly out of the box. However, a notable portion of consumers describe receiving incorrect parts, poor-quality plastic components, and items that did not match their existing trim or fit as expected.'
        },
        delivery: {
            title: 'Delivery service',
            summary: 'Consumers generally express satisfaction with the delivery service, frequently highlighting fast shipping with many orders arriving the next day. Customers appreciate the option for premium delivery, which has helped them get back on the road quickly. However, some reviewers report issues with specific couriers losing packages or delivering them to incorrect addresses, with replacement parts sometimes needing to be sent out a second time.'
        },
        order: {
            title: 'Order',
            summary: 'Clients share ambiguous opinions on order experiences. Many customers report positive experiences, praising quick deliveries, accurate parts, and helpful customer service when ordering. Some reviewers received their orders within 24 hours and found the parts fit perfectly. However, a significant number of consumers express dissatisfaction, citing issues like hidden charges, missing transaction history, and receiving incorrect or empty orders. Some also experienced multiple delays and unhelpful customer service when trying to resolve order problems.'
        },
        quality: {
            title: 'Quality',
            summary: 'Reviewers mention ambiguous feedback about quality. Many customers praise the quality of car parts, noting that pieces fit perfectly and feel comparable to original dealer parts at a fraction of the price. Several mention impressive build quality on items like wing mirrors and replacement glass. On the other hand, a smaller number of consumers describe poor-quality plastic mirror parts and trim pieces that did not match the texture or finish of their original components.'
        },
        price: {
            title: 'Price',
            summary: 'Customers had ambiguous experiences with price. Many reviewers found prices to be competitive and great, with significant savings compared to dealer prices — in some cases saving over £50 on a single part. Customers appreciate finding hard-to-source items at affordable price points. However, a few reviewers experienced hidden charges and felt that resolving issues like incorrect parts left them out of pocket once postage and time were factored in.'
        }
    };

    const REVIEWS = [
        {
            name: 'amarjit manik', initials: 'AM', color: 'green', country: 'GB', reviewCount: 7,
            date: 'Apr 3, 2026', experienceDate: '3 March 2026', stars: 5, unprompted: true,
            title: '5 star service as it should be.',
            text: '5 star service as it should be.\nQuick delivery.\nOrdered wrong rear lights, when contacting Pete from OMQ was helpful advising our car had the face lift and the correct lights to order, return was simple and correct lights arrived next day.\nSimple plug and play lights took less then 20 mins to change both.'
        },
        {
            name: 'Les', initials: 'LE', color: 'yellow', country: 'GB', reviewCount: 11,
            date: 'Jan 30, 2026', experienceDate: '29 January 2026', stars: 5, unprompted: true,
            title: 'Excellent service from OMQ Auto Parts Hub',
            text: 'I have a 2014 new shape Hyundai i10 and my drivers door mirrors had a coming together with another mirror. Hyundai wanted over £500 to replace the whole mirror assembly as they don\'t sell just a cover. OMQ Auto Parts Hub had the exact cover I needed for under £30. Ordered Monday, arrived Wednesday, fitted in 15 minutes. Perfect colour match too.'
        },
        {
            name: 'Simon Head', initials: 'SH', color: 'blue', country: 'GB', reviewCount: 1,
            date: 'Jan 17, 2026', experienceDate: '14 January 2026', stars: 5, unprompted: true,
            title: 'Excellent customer service',
            text: 'Excellent customer service from OMQ Auto Parts. I Ordered a wing mirror glass on a Wednesday night and it was despatched the next day. It was sent 48 hrs and after it still hadn\'t arrived by the following Tuesday it was returned to sender by EVRI. Pete from OMQ handled the replacement quickly and even refunded the postage. Top marks.'
        },
        {
            name: 'Elizabeth Thompson', initials: 'ET', color: 'pink', country: 'GB', reviewCount: 13,
            date: 'Jan 16, 2026', experienceDate: '12 January 2026', stars: 5, unprompted: true,
            title: 'Great value, easy to fit',
            text: 'Easy-to-use website. Excellent communication. Good prices. Excellent quality. Easy to fit.\nThe OMQ website was very easy to use to find parts specific to my car. I ordered wing mirror glasses for both sides and they fitted perfectly first time. Would definitely recommend OMQ Auto Parts Hub to anyone needing replacement parts.'
        },
        {
            name: 'Mr Simon Culver', initials: 'MS', color: 'yellow', country: 'GB', reviewCount: 14,
            date: 'Dec 4, 2025', experienceDate: '28 November 2025', stars: 1, unprompted: true, replied: true,
            title: 'Awful firm',
            text: 'Awful firm. I ordered an item from OMQ Auto Parts via Amazon. The courier they use delivered it to a completely incorrect address, and I have photographic evidence of this. They are failing to resolve this matter despite multiple emails and Amazon\'s involvement. Avoid.'
        },
        {
            name: 'David Nicolae Dragan', initials: 'DN', color: 'pink', country: 'GB', reviewCount: 6,
            date: 'Dec 3, 2025', experienceDate: '30 November 2025', stars: 4, unprompted: true,
            title: 'Good product, change the courier',
            text: 'I order with OMQ the item was very good price and quality.\nChange the delivery company that you give to client to chose ( EVRI).\nI had bad experience with them.\nI order an Ford oil pan/sump and EVRI lost it in transit. OMQ Auto Parts Hub did send a replacement but it took an extra week.'
        },
        {
            name: 'Tom Taylor', initials: 'TT', color: 'orange', country: 'GB', reviewCount: 1,
            date: 'Nov 29, 2025', experienceDate: '28 November 2025', stars: 5, unprompted: true,
            title: 'Super fast delivery!',
            text: 'Thank you OMQ Auto Parts Hub. Super fast delivery! Ordered on Friday early afternoon and arrived on a Saturday! Well worth paying the little extra for premium delivery as it helped me get out of a bind before a long drive on Monday morning. Part fitted perfectly.'
        },
        {
            name: 'Bethany Rose', initials: 'BR', color: 'green', country: 'GB', reviewCount: 2,
            date: 'Nov 1, 2025', experienceDate: '29 October 2025', stars: 5, unprompted: true,
            title: 'Found the part nobody else had',
            text: 'I hardly ever leave reviews, but I needed to let others know about OMQ. I had been searching EVERYWHERE for a rear windscreen wiper for my Fiat 500X, but the ones you get from well known stores just didn\'t fit. OMQ Auto Parts had the exact one I needed, ordered Tuesday, arrived Wednesday morning. Couldn\'t be happier.'
        },
        {
            name: 'James O\'Connor', initials: 'JO', color: 'blue', country: 'GB', reviewCount: 5,
            date: 'Oct 22, 2025', experienceDate: '18 October 2025', stars: 5, unprompted: true,
            title: 'Brilliant, would buy again',
            text: 'Top notch service from OMQ Auto Parts. Needed a replacement tail light cluster for my VW Golf MK7 and OMQ had it in stock when no one else did. Quick dispatch, well packaged and exactly as described. Fitted in under 30 minutes.'
        },
        {
            name: 'Priya Sharma', initials: 'PS', color: 'pink', country: 'GB', reviewCount: 9,
            date: 'Oct 15, 2025', experienceDate: '10 October 2025', stars: 5, unprompted: true,
            title: 'Saved me a fortune',
            text: 'My local Mazda dealership quoted me £180 for a wing mirror indicator lens. OMQ Auto Parts Hub had the exact OEM-quality part for £24. Arrived the next day, fitted in 5 minutes. Highly recommend OMQ to anyone trying to save money on car parts.'
        },
        {
            name: 'Daniel Wright', initials: 'DW', color: 'orange', country: 'GB', reviewCount: 3,
            date: 'Sep 28, 2025', experienceDate: '25 September 2025', stars: 4, unprompted: true,
            title: 'Good parts, slight delay',
            text: 'Good quality parts from OMQ. Delivery took a day longer than estimated but the customer service team were quick to update me. Part fitted perfectly. Would order from OMQ Auto Parts again.'
        },
        {
            name: 'Sarah Mitchell', initials: 'SM', color: 'yellow', country: 'GB', reviewCount: 18,
            date: 'Sep 14, 2025', experienceDate: '11 September 2025', stars: 5, unprompted: true,
            title: 'Excellent quality and price',
            text: 'OMQ Auto Parts Hub is now my go-to for replacement car parts. Genuine-feeling quality, competitive prices, and fast UK shipping. Their reg-number lookup makes finding the right part effortless.'
        }
    ];

    const starsSvg = (rating) => {
        const svgs = {
            1: 'assets/stars-1.svg',
            4: 'assets/stars-4.svg',
            5: 'assets/stars-5.svg'
        };
        return svgs[rating] || svgs[5];
    };

    const renderReviewCard = (r, index) => `
        <article class="review-mini-card" data-review-index="${index}">
            <div class="review-consumer">
                <div class="review-avatar ${r.color}">${r.initials}</div>
                <div>
                    <div class="review-consumer-name">${r.name}</div>
                    <div class="review-consumer-date">${r.date}</div>
                </div>
            </div>
            <div class="review-stars">
                <img src="${starsSvg(r.stars)}" alt="Rated ${r.stars} out of 5 stars" />
            </div>
            <p class="review-text">${(r.text.split('\n')[0]).slice(0, 200)}${r.text.length > 200 ? '...' : ''} <span class="review-see-more">See more</span></p>
            ${r.replied ? `<div class="review-company-replied">
                <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1V1C1 7.07513 5.92574 12 12.0009 12C12.3442 12 12.6783 12 13 12" stroke="#6E7689" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Company replied
            </div>` : ''}
            <div class="review-actions">
                <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="review-action">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.94.94A1.5 1.5 0 0 1 10.5 2a20.774 20.774 0 0 1-.384 4H14.5A1.5 1.5 0 0 1 16 7.5v.066l-1.845 6.9-.094.095A1.5 1.5 0 0 1 13 15H9c-.32 0-.685-.078-1.038-.174-.357-.097-.743-.226-1.112-.349l-.008-.003c-.378-.126-.74-.246-1.067-.335C5.44 14.047 5.18 14 5 14v.941l-5 .625V6h5v.788c.913-.4 1.524-1.357 1.926-2.418A10.169 10.169 0 0 0 7.5 1.973 1.5 1.5 0 0 1 7.94.939Z"/></svg>
                    Useful
                </a>
                <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="review-action">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-3 2a3 3 0 1 1 .583 1.778L5.867 7.115a3 3 0 0 1 0 1.77l4.716 2.337a3 3 0 1 1-.45.893L5.417 9.778a3 3 0 1 1 0-3.556l4.716-2.337A3.002 3.002 0 0 1 10 3Z"/></svg>
                    Share
                </a>
                <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="review-action" style="margin-left:auto" title="Flag this review" aria-label="Flag">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 .25V0H2v16h1V9.25h11.957l-4.5-4.5 4.5-4.5H3Zm0 1v7h9.543l-3.5-3.5 3.5-3.5H3Z"/></svg>
                </a>
            </div>
        </article>
    `;

    const renderReviewDetail = (r) => `
        <div class="review-detail-consumer-header">
            <div class="review-detail-consumer">
                <div class="review-detail-avatar ${r.color}">${r.initials}</div>
                <div>
                    <div class="review-detail-name">${r.name}</div>
                    <div class="review-detail-meta">
                        <span>${r.country}</span>
                        <span class="dot">•</span>
                        <span>${r.reviewCount} review${r.reviewCount === 1 ? '' : 's'}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="review-detail-rating-row">
            <div class="review-detail-stars">
                <img src="${starsSvg(r.stars)}" alt="Rated ${r.stars} out of 5 stars" />
            </div>
            <div class="review-detail-date">${r.date}</div>
        </div>
        <h3 class="review-detail-title">${r.title}</h3>
        <p class="review-detail-text">${r.text.replace(/\n/g, '<br>')}</p>
        <div class="review-detail-badges">
            <span class="review-detail-badge">${r.experienceDate}</span>
            ${r.unprompted ? '<span class="review-detail-badge">Unprompted review</span>' : ''}
        </div>
        <div class="review-detail-actions">
            <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="review-detail-action">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.94.94A1.5 1.5 0 0 1 10.5 2a20.774 20.774 0 0 1-.384 4H14.5A1.5 1.5 0 0 1 16 7.5v.066l-1.845 6.9-.094.095A1.5 1.5 0 0 1 13 15H9c-.32 0-.685-.078-1.038-.174-.357-.097-.743-.226-1.112-.349l-.008-.003c-.378-.126-.74-.246-1.067-.335C5.44 14.047 5.18 14 5 14v.941l-5 .625V6h5v.788c.913-.4 1.524-1.357 1.926-2.418A10.169 10.169 0 0 0 7.5 1.973 1.5 1.5 0 0 1 7.94.939Z"/></svg>
                Useful
            </a>
            <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="review-detail-action">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-3 2a3 3 0 1 1 .583 1.778L5.867 7.115a3 3 0 0 1 0 1.77l4.716 2.337a3 3 0 1 1-.45.893L5.417 9.778a3 3 0 1 1 0-3.556l4.716-2.337A3.002 3.002 0 0 1 10 3Z"/></svg>
                Share
            </a>
            <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="review-detail-action flag" aria-label="Flag this review" title="Flag this review">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 .25V0H2v16h1V9.25h11.957l-4.5-4.5 4.5-4.5H3Zm0 1v7h9.543l-3.5-3.5 3.5-3.5H3Z"/></svg>
            </a>
        </div>
    `;

    const modal = document.getElementById('topicModal');
    const modalBackdrop = modal && modal.querySelector('.topic-modal-backdrop');
    const modalClose = modal && modal.querySelector('.topic-modal-close');
    const modalBack = modal && modal.querySelector('.topic-modal-back');
    const modalTitle = modal && modal.querySelector('#topicModalTitle');
    const modalSummary = modal && modal.querySelector('.topic-modal-summary');
    const reviewsCarousel = modal && modal.querySelector('.reviews-carousel');
    const reviewsPrev = modal && modal.querySelector('.reviews-nav-prev');
    const reviewsNext = modal && modal.querySelector('.reviews-nav-next');
    const topicView = modal && modal.querySelector('.topic-view');
    const reviewView = modal && modal.querySelector('.review-view');
    const reviewDetail = modal && modal.querySelector('.review-detail');

    const updateReviewsNavVisibility = () => {
        if (!reviewsCarousel) return;
        const { scrollLeft, scrollWidth, clientWidth } = reviewsCarousel;
        reviewsPrev.hidden = scrollLeft <= 0;
        reviewsNext.hidden = scrollLeft + clientWidth >= scrollWidth - 1;
    };

    const showTopicView = () => {
        if (!modal) return;
        reviewView.hidden = true;
        topicView.hidden = false;
        modalBack.hidden = true;
    };

    const showReviewView = (index) => {
        if (!modal) return;
        const r = REVIEWS[index];
        if (!r) return;
        reviewDetail.innerHTML = renderReviewDetail(r);
        topicView.hidden = true;
        reviewView.hidden = false;
        modalBack.hidden = false;
        // Scroll modal dialog to top
        if (reviewView.scrollTo) reviewView.scrollTo({ top: 0 });
    };

    const openTopicModal = (topicKey) => {
        const topic = TOPIC_DATA[topicKey];
        if (!topic || !modal) return;
        modalTitle.textContent = topic.title;
        modalSummary.textContent = topic.summary;
        reviewsCarousel.innerHTML = REVIEWS.map((r, i) => renderReviewCard(r, i)).join('');

        // Attach direct click handler on each review card for reliability
        reviewsCarousel.querySelectorAll('.review-mini-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.review-action')) return;
                const idx = parseInt(card.dataset.reviewIndex, 10);
                if (!Number.isNaN(idx)) showReviewView(idx);
            });
        });

        showTopicView();
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        reviewsCarousel.scrollLeft = 0;
        setTimeout(updateReviewsNavVisibility, 50);
    };

    const closeTopicModal = () => {
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = '';
        showTopicView();
    };

    // Wire up topic cards
    document.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', () => {
            const topicKey = card.dataset.topic;
            if (topicKey) openTopicModal(topicKey);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const topicKey = card.dataset.topic;
                if (topicKey) openTopicModal(topicKey);
            }
        });
    });

    // Review card click → open detail (delegated)
    if (reviewsCarousel) {
        reviewsCarousel.addEventListener('click', (e) => {
            // Don't trigger detail when clicking action buttons (Useful/Share/Flag)
            if (e.target.closest('.review-action')) return;

            const card = e.target.closest('.review-mini-card');
            if (!card) return;
            const idx = parseInt(card.dataset.reviewIndex, 10);
            if (!Number.isNaN(idx)) showReviewView(idx);
        });
    }

    if (modalBack) modalBack.addEventListener('click', showTopicView);
    if (modalClose) modalClose.addEventListener('click', closeTopicModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeTopicModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.hidden) {
            if (!reviewView.hidden) showTopicView();
            else closeTopicModal();
        }
    });

    if (reviewsPrev) reviewsPrev.addEventListener('click', () => {
        reviewsCarousel.scrollBy({ left: -334, behavior: 'smooth' });
    });
    if (reviewsNext) reviewsNext.addEventListener('click', () => {
        reviewsCarousel.scrollBy({ left: 334, behavior: 'smooth' });
    });
    if (reviewsCarousel) reviewsCarousel.addEventListener('scroll', updateReviewsNavVisibility);

    // ============== REVIEWS SHAPING (main page carousel) ==============
    const shapingCarousel = document.querySelector('.shaping-carousel');
    const shapingPrev = document.querySelector('.shaping-nav-prev');
    const shapingNext = document.querySelector('.shaping-nav-next');

    if (shapingCarousel) {
        shapingCarousel.innerHTML = REVIEWS.map((r, i) => renderReviewCard(r, i)).join('');

        // Wire up click → open review detail directly
        shapingCarousel.querySelectorAll('.review-mini-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.review-action')) return;
                const idx = parseInt(card.dataset.reviewIndex, 10);
                if (!Number.isNaN(idx)) openReviewDirect(idx);
            });
        });

        const updateShapingNav = () => {
            const { scrollLeft, scrollWidth, clientWidth } = shapingCarousel;
            if (shapingPrev) shapingPrev.hidden = scrollLeft <= 0;
            if (shapingNext) shapingNext.hidden = scrollLeft + clientWidth >= scrollWidth - 1;
        };

        if (shapingPrev) shapingPrev.addEventListener('click', () => {
            shapingCarousel.scrollBy({ left: -334, behavior: 'smooth' });
        });
        if (shapingNext) shapingNext.addEventListener('click', () => {
            shapingCarousel.scrollBy({ left: 334, behavior: 'smooth' });
        });
        shapingCarousel.addEventListener('scroll', updateShapingNav);
        window.addEventListener('resize', updateShapingNav);
        updateShapingNav();
    }

    // Open review detail directly (not from a topic) — used by main-page cards
    const openReviewDirect = (index) => {
        if (!modal) return;
        const r = REVIEWS[index];
        if (!r) return;
        reviewDetail.innerHTML = renderReviewDetail(r);
        topicView.hidden = true;
        reviewView.hidden = false;
        modalBack.hidden = true;  // No topic to go back to
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        if (reviewView.scrollTo) reviewView.scrollTo({ top: 0 });
    };

    // ============== PEOPLE ALSO LOOKED AT ==============
    const SIMILAR_BUSINESSES = [
        { name: 'AUTODOC - Great Britain', url: 'www.autodoc.co.uk', rating: 4.2, count: '17k', stars: 4, logo: 'assets/business-logos/5721cdf10000ff00058c2172-198x149-1x.avif' },
        { name: 'Wingmirrorparts', url: 'wingmirrorparts.com', rating: 4.6, count: '846', stars: 4.5, logo: 'assets/business-logos/664f446917b01faefa8177df-198x149-1x.avif' },
        { name: 'Car Wing Mirror Glass', url: 'carwingmirrorglass.co.uk', rating: 3.8, count: '41', stars: 4, logo: 'assets/business-logos/61cac1d0d2e1a77e56bf0966-198x149-1x.avif' },
        { name: 'Thewingmirrorcompany', url: 'www.thewingmirrorcompany.co.uk', rating: 4.5, count: '306', stars: 4.5, logo: 'assets/business-logos/5c0fa870ba7f24000112d9ab-198x149-1x.avif' },
        { name: 'Onlinecarparts - Great Britain', url: 'onlinecarparts.co.uk', rating: 4.1, count: '2k', stars: 4, logo: 'assets/business-logos/5803f8d80000ff0005962008-198x149-1x.avif' },
        { name: '247 Blinds', url: 'www.247blinds.co.uk', rating: 4.7, count: '92k', stars: 4.5, logo: 'assets/business-logos/48e90eca000064000503c3a0-198x149-1x.avif' },
        { name: 'Wickes', url: 'www.wickes.co.uk', rating: 4.4, count: '70k', stars: 4.5, logo: 'assets/business-logos/487ca1cb000064000502f4e2-198x149-1x.avif' },
        { name: 'Dino Decking', url: 'dino.co.uk', rating: 4.8, count: '5k', stars: 5, logo: 'assets/business-logos/65ae7292d7f9fa46dac36239-198x149-1x.avif' }
    ];

    const renderSimilarCard = (b) => `
        <a href="https://uk.trustpilot.com/review/${b.url}" class="similar-card" target="_blank" rel="noopener">
            <div class="similar-card-image">
                <img src="${b.logo}" alt="${b.name} logo" loading="lazy" />
            </div>
            <h3 class="similar-card-name">${b.name}</h3>
            <p class="similar-card-url">${b.url}</p>
            <div class="similar-card-rating">
                <img src="assets/stars-${b.stars}.svg" alt="TrustScore ${b.stars} out of 5" />
                <span class="similar-card-score">${b.rating}</span>
                <span class="similar-card-count">(${b.count})</span>
            </div>
        </a>
    `;

    const similarCarousel = document.querySelector('.similar-carousel');
    const similarPrev = document.querySelector('.similar-nav-prev');
    const similarNext = document.querySelector('.similar-nav-next');

    if (similarCarousel) {
        similarCarousel.innerHTML = SIMILAR_BUSINESSES.map(renderSimilarCard).join('');

        const updateSimilarNav = () => {
            const { scrollLeft, scrollWidth, clientWidth } = similarCarousel;
            if (similarPrev) similarPrev.disabled = scrollLeft <= 0;
            if (similarNext) similarNext.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
        };

        if (similarPrev) similarPrev.addEventListener('click', () => {
            similarCarousel.scrollBy({ left: -496, behavior: 'smooth' });
        });
        if (similarNext) similarNext.addEventListener('click', () => {
            similarCarousel.scrollBy({ left: 496, behavior: 'smooth' });
        });
        similarCarousel.addEventListener('scroll', updateSimilarNav);
        window.addEventListener('resize', updateSimilarNav);
        updateSimilarNav();
    }

    // ============== ALL REVIEWS LIST ==============
    const allReviewsList = document.querySelector('.all-reviews-list');
    if (allReviewsList && typeof REVIEWS !== 'undefined') {
        const starsSrc = (rating) => {
            const map = { 1: 'assets/stars-1.svg', 2: 'assets/stars-2.svg', 3: 'assets/stars-3.svg', 4: 'assets/stars-4.svg', 5: 'assets/stars-5.svg' };
            return map[rating] || map[5];
        };

        const renderFullReviewCard = (r) => {
            const title = r.title || (r.text ? r.text.split('\n')[0].slice(0, 70) : 'Review');
            const country = r.country || 'GB';
            const reviewCount = r.reviewCount || 1;
            return `
                <article class="full-review-card">
                    <div class="full-review-header">
                        <div class="full-review-consumer">
                            <div class="full-review-avatar ${r.color || 'blue'}">${r.initials || ''}</div>
                            <div class="full-review-consumer-info">
                                <span class="full-review-name">${r.name}</span>
                                <span class="full-review-meta">
                                    <span>${country}</span>
                                    <span class="lil-dot">•</span>
                                    <span>${reviewCount} review${reviewCount === 1 ? '' : 's'}</span>
                                </span>
                            </div>
                        </div>
                        <div class="full-review-date">${r.date}</div>
                    </div>
                    <div class="full-review-stars">
                        <img src="${starsSrc(r.stars)}" alt="Rated ${r.stars} out of 5 stars" />
                    </div>
                    <h3 class="full-review-title">${title}</h3>
                    <p class="full-review-text">${(r.text || '').replace(/\n/g, '<br>')}</p>
                    <div class="full-review-badges">
                        ${r.experienceDate ? `<span class="full-review-badge">${r.experienceDate}</span>` : ''}
                        ${r.unprompted ? '<span class="full-review-badge">Unprompted review</span>' : ''}
                    </div>
                    <div class="full-review-actions">
                        <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="full-review-action">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.94.94A1.5 1.5 0 0 1 10.5 2a20.774 20.774 0 0 1-.384 4H14.5A1.5 1.5 0 0 1 16 7.5v.066l-1.845 6.9-.094.095A1.5 1.5 0 0 1 13 15H9c-.32 0-.685-.078-1.038-.174-.357-.097-.743-.226-1.112-.349l-.008-.003c-.378-.126-.74-.246-1.067-.335C5.44 14.047 5.18 14 5 14v.941l-5 .625V6h5v.788c.913-.4 1.524-1.357 1.926-2.418A10.169 10.169 0 0 0 7.5 1.973 1.5 1.5 0 0 1 7.94.939Z"/></svg>
                            Useful
                        </a>
                        <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="full-review-action">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-3 2a3 3 0 1 1 .583 1.778L5.867 7.115a3 3 0 0 1 0 1.77l4.716 2.337a3 3 0 1 1-.45.893L5.417 9.778a3 3 0 1 1 0-3.556l4.716-2.337A3.002 3.002 0 0 1 10 3Z"/></svg>
                            Share
                        </a>
                        <a href="https://uk.trustpilot.com/users/login" target="_blank" rel="noopener" class="full-review-action flag" aria-label="Flag this review" title="Flag this review">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 .25V0H2v16h1V9.25h11.957l-4.5-4.5 4.5-4.5H3Zm0 1v7h9.543l-3.5-3.5 3.5-3.5H3Z"/></svg>
                        </a>
                    </div>
                    ${r.replied ? `
                        <div class="full-review-reply">
                            <div class="full-review-reply-content">
                                <div class="full-review-reply-header">
                                    <div class="full-review-reply-logo">US</div>
                                    <div>
                                        <div class="full-review-reply-name">Reply from OMQ Auto Parts Hub</div>
                                        <div class="full-review-reply-date">${r.date}</div>
                                    </div>
                                </div>
                                <p class="full-review-reply-text">Thank you for taking the time to share your feedback. We've reached out directly to look into this and reach a resolution.</p>
                            </div>
                        </div>
                    ` : ''}
                </article>
            `;
        };

        // Generate reviews by cycling through the source data and varying details
        const TOTAL_REVIEWS = 5245;
        const PAGE_SIZE = 20;
        const expanded = [];
        const baseDate = new Date(2026, 4, 18); // May 18, 2026
        for (let i = 0; i < TOTAL_REVIEWS; i++) {
            const src = REVIEWS[i % REVIEWS.length];
            const offsetDays = i * 2;
            const d = new Date(baseDate);
            d.setDate(d.getDate() - offsetDays);
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthNamesFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const cardDate = `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
            const expDate = new Date(d); expDate.setDate(expDate.getDate() - 2);
            const expBadge = `${expDate.getDate()} ${monthNamesFull[expDate.getMonth()]} ${expDate.getFullYear()}`;
            expanded.push({ ...src, date: cardDate, experienceDate: expBadge });
        }

        // ============== FUNCTIONAL PAGINATION ==============
        const totalPages = Math.ceil(expanded.length / PAGE_SIZE);
        let currentPage = 1;

        const renderPage = (pageNum) => {
            const start = (pageNum - 1) * PAGE_SIZE;
            const slice = expanded.slice(start, start + PAGE_SIZE);
            allReviewsList.innerHTML = slice.map(renderFullReviewCard).join('');
            currentPage = pageNum;
            updatePagination();
            // Scroll the reviews list back into view
            const allReviewsSection = document.querySelector('.all-reviews-section');
            if (allReviewsSection) {
                allReviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        const paginationEl = document.querySelector('.reviews-pagination');

        const updatePagination = () => {
            if (!paginationEl) return;

            const prevDisabled = currentPage === 1;
            const nextDisabled = currentPage === totalPages;

            // Build the page-number window
            // Show: prev / 1 / 2 / 3 / 4 / ... / next-page
            // If currentPage > 3, slide window: ... / cur-1 / cur / cur+1 / ...
            let pageNumbers = [];
            if (totalPages <= 6) {
                for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
            } else if (currentPage <= 3) {
                pageNumbers = [1, 2, 3, 4, 'ellipsis'];
            } else if (currentPage >= totalPages - 2) {
                pageNumbers = ['ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pageNumbers = ['ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis'];
            }

            const pagesHTML = pageNumbers.map(n => {
                if (n === 'ellipsis') return '<span class="pagination-ellipsis">···</span>';
                const activeClass = n === currentPage ? ' active' : '';
                return `<button class="pagination-btn pagination-page${activeClass}" data-page="${n}">${n}</button>`;
            }).join('');

            paginationEl.innerHTML = `
                <button class="pagination-btn pagination-prev" ${prevDisabled ? 'disabled' : ''} data-action="prev">Previous</button>
                ${pagesHTML}
                <button class="pagination-btn pagination-next" ${nextDisabled ? 'disabled' : ''} data-action="next">Next page</button>
            `;
        };

        if (paginationEl) {
            paginationEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.pagination-btn');
                if (!btn || btn.disabled) return;

                const action = btn.dataset.action;
                const page = parseInt(btn.dataset.page, 10);

                if (action === 'prev' && currentPage > 1) {
                    renderPage(currentPage - 1);
                } else if (action === 'next' && currentPage < totalPages) {
                    renderPage(currentPage + 1);
                } else if (!Number.isNaN(page)) {
                    renderPage(page);
                }
            });
        }

        // Initial render — page 1
        renderPage(1);
    }
});
