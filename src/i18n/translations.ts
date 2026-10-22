export type TranslationKey =
  | 'today.title'
  | 'today.empty'
  | 'today.noService'
  | 'today.timeZone'
  | 'today.staffUnavailable'
  | 'today.retryStaff'
  | 'dashboard.overview'
  | 'dashboard.visitHistory'
  | 'dashboard.openCalendar'

  | 'google.title'
  | 'google.failed'
  | 'google.unavailable'
  | 'google.linkRequired'
  | 'google.password'
  | 'google.linkConsent'
  | 'google.link'
  | 'pilot.active'
  | 'pilot.readOnly'
  | 'pilot.blocked'
  | 'pilot.paymentUnavailable'
  | 'pilot.aiOptIn'
  | 'pilot.unavailable'
  | 'pilot.invitation'
  | 'pilot.emailUnavailable'
  | 'pilot.aiSubscribe'
  | 'pricing.start'
  | 'pricing.standard'
  | 'pricing.business'
  | 'pricing.largeBusiness'
  | 'pricing.product'
  | 'pricing.more'
  | 'pricing.less'
  | 'pricing.visits'
  | 'pricing.requests'
  | 'pricing.empty'
  | 'pricing.try'
  | 'pricing.trial'
  | 'pilot.signupClosed'

  | 'portal.title'
  | 'portal.login.title'
  | 'portal.login.subtitle'
  | 'portal.login.salon'
  | 'portal.login.salonHint'
  | 'portal.login.email'
  | 'portal.login.submit'
  | 'portal.login.sending'
  | 'portal.login.sentTitle'
  | 'portal.login.sent'
  | 'portal.login.another'
  | 'portal.login.verifying'
  | 'portal.login.invalidLink'
  | 'portal.login.failed'
  | 'portal.login.needSalon'
  | 'portal.signedInAs'
  | 'portal.logout'
  | 'portal.upcoming'
  | 'portal.past'
  | 'portal.noUpcoming'
  | 'portal.noPast'
  | 'portal.manage'
  | 'portal.openingManage'
  | 'portal.manageError'
  | 'portal.manageHint'
  | 'portal.bookAgain'
  | 'portal.bookingDisabled'
  | 'portal.loyalty.title'
  | 'portal.loyalty.points'
  | 'portal.loyalty.cashback'
  | 'portal.loyalty.level'
  | 'portal.loyalty.benefits'
  | 'portal.loyalty.empty'
  | 'portal.forms.title'
  | 'portal.forms.empty'
  | 'portal.forms.version'
  | 'portal.forms.answers'
  | 'portal.forms.noAnswers'
  | 'portal.sessionExpiredTitle'
  | 'portal.sessionExpiredText'
  | 'portal.goToLogin'
  | 'portal.loadError'
  | 'portal.visitNumber'
  | 'legacy.title'
  | 'legacy.subtitle'
  | 'legacy.pin'
  | 'legacy.show'
  | 'legacy.showing'
  | 'legacy.invalid'
  | 'legacy.locked'
  | 'legacy.missingCode'
  | 'legacy.client'
  | 'legacy.visits'
  | 'legacy.noVisits'
  | 'legacy.back'
  | 'legacy.qr'
  | 'legacy.qrHint'
  | 'visits.savedLoyaltyWarning'
  | 'validation.visitEnd'
  | 'validation.commission'
  | 'validation.salary'
  | 'validation.price'
  | 'loyalty.businessRequired'
  | 'common.item'
  | 'common.value'
  | 'subscription.paidByOwner'
  | 'subscription.ownerPlanInactive'
  | 'unit.pcs'
  | 'unit.ml'
  | 'unit.l'
  | 'unit.g'
  | 'unit.kg'
  | 'unit.m'
  | 'unit.pack'
  | 'expenseCategory.rent'
  | 'expenseCategory.salaries'
  | 'expenseCategory.stock_purchase'
  | 'expenseCategory.marketing'
  | 'expenseCategory.utilities'
  | 'expenseCategory.subscriptions'
  | 'expenseCategory.other'
  | 'expenseSource.salary_payment'
  | 'plan.admin_up_to_3_employees'
  | 'plan.admin_up_to_7_employees'
  | 'plan.admin_up_to_15_employees'
  | 'plan.admin_unlimited_monthly'
  | 'plan.admin_unlimited_yearly'
  | 'plan.solo_basic'
  | 'plan.solo_pro'
  | 'plan.features.admin_up_to_3_employees'
  | 'plan.features.admin_up_to_7_employees'
  | 'plan.features.admin_up_to_15_employees'
  | 'plan.features.admin_unlimited_monthly'
  | 'plan.features.admin_unlimited_yearly'
  | 'plan.features.solo_basic'
  | 'plan.features.solo_pro'
  | 'clientForm.existsPhone'
  | 'clientForm.existsEmail'
  | 'clientForm.existsNameBirth'
  | 'clientForm.exists'
  | 'clientForm.openExisting'
  | 'import.alreadyInList'
  | 'import.openClient'
  | 'login.twoFactorPrompt'
  | 'login.twoFactorCode'
  | 'login.twoFactorWrong'
  | 'login.twoFactorBack'
  | 'login.forgotPassword'
  | 'forgot.subtitle'
  | 'forgot.email'
  | 'forgot.submit'
  | 'forgot.sending'
  | 'forgot.successTitle'
  | 'forgot.success'
  | 'forgot.backToLogin'
  | 'forgot.failed'
  | 'reset.subtitle'
  | 'reset.newPassword'
  | 'reset.confirmPassword'
  | 'reset.submit'
  | 'reset.saving'
  | 'reset.successTitle'
  | 'reset.success'
  | 'reset.invalidTitle'
  | 'reset.invalid'
  | 'reset.requestNew'
  | 'reset.backToLogin'
  | 'reset.failed'
  | 'errors.tooManyRequests'
  | 'errors.tooManyRequestsLater'
  | 'errors.loginThrottled'
  | 'errors.loginThrottledLater'
  | 'errors.notFound'
  | 'errors.methodNotAllowed'
  | 'errors.subscriptionRequired'
  | 'errors.visitLimit'
  | 'time.seconds'
  | 'time.minutes'
  | 'validation.code.missing'
  | 'validation.code.empty'
  | 'validation.code.string_too_short'
  | 'validation.code.string_too_long'
  | 'validation.code.greater_than_equal'
  | 'validation.code.greater_than'
  | 'validation.code.less_than_equal'
  | 'validation.code.less_than'
  | 'validation.code.number'
  | 'validation.code.date'
  | 'validation.code.date_out_of_range'
  | 'validation.code.invalid_time_range'
  | 'validation.code.end_before_start'
  | 'validation.code.weak_password'
  | 'validation.code.invalid_phone'
  | 'validation.code.invalid_email'
  | 'validation.code.invalid_birth_date'
  | 'validation.code.invalid_currency'
  | 'validation.code.invalid_timezone'
  | 'validation.code.invalid_choice'
  | 'validation.code.payment_method_required'
  | 'validation.code.string_type'
  | 'validation.code.bool'
  | 'field.full_name'
  | 'field.name'
  | 'field.email'
  | 'field.phone'
  | 'field.password'
  | 'field.birth_date'
  | 'field.date_start'
  | 'field.date_end'
  | 'field.price'
  | 'field.amount'
  | 'field.quantity'
  | 'field.base_salary'
  | 'field.commission_rate'
  | 'field.currency'
  | 'field.duration_minutes'
  | 'field.unit'
  | 'pagination.previous'
  | 'pagination.next'
  | 'pagination.range'
  | 'pagination.perPage'
  | 'pagination.label'

  | 'clientForm.fullName'
  | 'clientForm.birthDate'
  | 'clientForm.gender'
  | 'clientForm.select'
  | 'clientForm.phoneHint'
  | 'clientForm.emailHint'
  | 'clientForm.pregnancy'
  | 'clientForm.personalNotes'
  | 'clientForm.personalNotesPlaceholder'
  | 'clientForm.create'
  | 'clientForm.update'
  | 'clientForm.nameRequired'
  | 'clientForm.invalidEmail'
  | 'clientForm.invalidPhone'
  | 'clientForm.saveError'
  | 'business.title'
  | 'business.create'
  | 'business.edit'
  | 'business.update'
  | 'business.name'
  | 'business.type'
  | 'business.address'
  | 'business.description'
  | 'business.currency'
  | 'business.empty'
  | 'business.namePlaceholder'
  | 'business.addressPlaceholder'
  | 'business.descriptionPlaceholder'
  | 'business.saveError'
  | 'business.assistant'
  | 'business.assistantHint'
  | 'business.assistantName'
  | 'business.assistantGender'
  | 'business.assistantGender.female'
  | 'business.assistantGender.male'
  | 'business.assistantGender.neuter'
  | 'business.assistantDefault'
  | 'business.assistantNameTooLong'
  | 'business.assistantNameInvalid'
  | 'business.publicBooking.title'
  | 'business.publicBooking.description'
  | 'business.publicBooking.enabled'
  | 'business.publicBooking.disabled'
  | 'business.publicBooking.enable'
  | 'business.publicBooking.disable'
  | 'business.publicBooking.saving'
  | 'business.publicBooking.saveError'
  | 'business.publicBooking.link'
  | 'business.publicBooking.copy'
  | 'business.publicBooking.copied'
  | 'business.publicBooking.copyError'
  | 'business.publicBooking.ready'
  | 'business.publicBooking.notReady'
  | 'business.publicBooking.servicesReady'
  | 'business.publicBooking.servicesMissing'
  | 'business.publicBooking.scheduleReady'
  | 'business.publicBooking.scheduleMissing'
  | 'business.publicBooking.setupServices'
  | 'business.publicBooking.setupSchedule'
  | 'business.publicBooking.disabledHint'
  | 'business.publicBooking.enabledNotReady'
  | 'booking.title'
  | 'booking.servicesTitle'
  | 'booking.noServices'
  | 'booking.priceOnRequest'
  | 'booking.unavailableTitle'
  | 'booking.unavailableText'
  | 'booking.contacts'
  | 'booking.noAccount'
  | 'booking.chooseService'
  | 'booking.multiHint'
  | 'booking.selectedServices'
  | 'booking.clearSelection'
  | 'booking.selectedCount'
  | 'booking.chainTotal'
  | 'booking.chainDuration'
  | 'booking.chainForOneMaster'
  | 'booking.chooseMaster'
  | 'booking.chooseTime'
  | 'booking.anyMaster'
  | 'booking.noStaff'
  | 'booking.noSlots'
  | 'booking.onlyFreeTimes'
  | 'booking.timezone'
  | 'booking.back'
  | 'booking.yourDetails'
  | 'booking.contactHint'
  | 'booking.nameRequired'
  | 'booking.contactRequired'
  | 'booking.contactOnlyOne'
  | 'booking.invalidEmail'
  | 'booking.invalidPhone'
  | 'booking.phoneHint'
  | 'booking.processingConsent'
  | 'booking.processingConsentRequired'
  | 'booking.marketingConsent'
  | 'booking.continue'
  | 'booking.summary'
  | 'booking.service'
  | 'booking.master'
  | 'booking.dateTime'
  | 'booking.price'
  | 'booking.contact'
  | 'booking.confirm'
  | 'booking.submitting'
  | 'booking.chooseAnotherTime'
  | 'booking.waitlist.cta'
  | 'booking.waitlist.noSlotsHint'
  | 'booking.waitlist.title'
  | 'booking.waitlist.notBooking'
  | 'booking.waitlist.explanation'
  | 'booking.waitlist.join'
  | 'booking.waitlist.decline'
  | 'booking.waitlist.joinedTitle'
  | 'booking.waitlist.joinedText'
  | 'booking.waitlist.leave'
  | 'booking.waitlist.leftTitle'
  | 'booking.waitlist.leftText'
  | 'booking.waitlist.emailRequired'
  | 'booking.waitlist.dateRange'
  | 'booking.waitlist.timePreference'
  | 'booking.waitlist.timeAny'
  | 'booking.waitlist.timeMorning'
  | 'booking.waitlist.timeAfternoon'
  | 'booking.waitlist.timeEvening'
  | 'booking.waitlist.dateFrom'
  | 'booking.waitlist.dateTo'
  | 'booking.waitlist.processingConsent'
  | 'waitlist.title'
  | 'waitlist.subtitle'
  | 'waitlist.filter.status'
  | 'waitlist.filter.service'
  | 'waitlist.filter.anyService'
  | 'waitlist.filter.dateFrom'
  | 'waitlist.filter.dateTo'
  | 'waitlist.filter.reset'
  | 'waitlist.status.all'
  | 'waitlist.status.active'
  | 'waitlist.status.cancelled'
  | 'waitlist.status.fulfilled'
  | 'waitlist.offer.pending'
  | 'waitlist.offer.accepted'
  | 'waitlist.offer.declined'
  | 'waitlist.offer.expired'
  | 'waitlist.offer.conflict'
  | 'waitlist.empty'
  | 'waitlist.table.guest'
  | 'waitlist.table.preferences'
  | 'waitlist.table.offer'
  | 'waitlist.table.created'
  | 'waitlist.table.actions'
  | 'waitlist.table.expires'
  | 'waitlist.table.noOffer'
  | 'waitlist.cancel'
  | 'waitlist.cancelConfirm'
  | 'waitlistOffer.title'
  | 'waitlistOffer.subtitle'
  | 'waitlistOffer.unavailableTitle'
  | 'waitlistOffer.unavailableText'
  | 'waitlistOffer.loadError'
  | 'waitlistOffer.notReserved'
  | 'waitlistOffer.expires'
  | 'waitlistOffer.accept'
  | 'waitlistOffer.accepting'
  | 'waitlistOffer.decline'
  | 'waitlistOffer.declining'
  | 'waitlistOffer.acceptedTitle'
  | 'waitlistOffer.acceptedText'
  | 'waitlistOffer.declinedTitle'
  | 'waitlistOffer.declinedText'
  | 'waitlistOffer.closedText'
  | 'waitlistOffer.actionError'
  | 'waitlistOffer.status.accepted'
  | 'waitlistOffer.status.declined'
  | 'waitlistOffer.status.expired'
  | 'waitlistOffer.status.conflict'
  | 'waitlistOffer.status.cancelled'
  | 'booking.successTitle'
  | 'booking.successText'
  | 'booking.bookingNumber'
  | 'booking.newBooking'
  | 'booking.manageLink'
  | 'booking.manageHint'
  | 'booking.depositTermsTitle'
  | 'booking.depositFixed'
  | 'booking.depositPercent'
  | 'booking.depositAmount'
  | 'booking.remainingAmount'
  | 'booking.holdMinutes'
  | 'booking.holdNote'
  | 'booking.heldTitle'
  | 'booking.heldText'
  | 'booking.payDeposit'
  | 'booking.payBefore'
  | 'payment.deposit'
  | 'payment.remaining'
  | 'payment.sandboxTitle'
  | 'payment.sandboxBadge'
  | 'payment.sandboxText'
  | 'payment.sandboxPay'
  | 'payment.sandboxFail'
  | 'payment.sandboxSending'
  | 'payment.alreadySettled'
  | 'payment.checkStatus'
  | 'payment.invalidLink'
  | 'payment.invalidLinkText'
  | 'payment.returnTitle'
  | 'payment.checking'
  | 'payment.waitingTitle'
  | 'payment.waitingText'
  | 'payment.waitingHint'
  | 'payment.checkAgain'
  | 'payment.paidTitle'
  | 'payment.paidText'
  | 'payment.failedTitle'
  | 'payment.failedText'
  | 'payment.expiredTitle'
  | 'payment.expiredText'
  | 'payment.cancelledTitle'
  | 'payment.cancelledText'
  | 'payment.reviewTitle'
  | 'payment.reviewText'
  | 'payment.loadError'
  | 'payment.status.pending'
  | 'payment.status.paid'
  | 'payment.status.failed'
  | 'payment.status.expired'
  | 'payment.status.cancelled'
  | 'payment.status.reconcile'
  | 'payment.status.partially_refunded'
  | 'payment.status.refunded'
  | 'finance.servicePayments.title'
  | 'finance.servicePayments.subtitle'
  | 'finance.servicePayments.empty'
  | 'finance.servicePayments.loadError'
  | 'finance.servicePayments.filter'
  | 'finance.servicePayments.allStatuses'
  | 'finance.servicePayments.client'
  | 'finance.servicePayments.service'
  | 'finance.servicePayments.visit'
  | 'finance.servicePayments.status'
  | 'finance.servicePayments.amount'
  | 'finance.servicePayments.refunded'
  | 'finance.servicePayments.refundable'
  | 'finance.servicePayments.holdExpires'
  | 'finance.servicePayments.refund'
  | 'finance.servicePayments.refundTitle'
  | 'finance.servicePayments.amountLabel'
  | 'finance.servicePayments.amountHint'
  | 'finance.servicePayments.reason'
  | 'finance.servicePayments.reasonPlaceholder'
  | 'finance.servicePayments.submit'
  | 'finance.servicePayments.submitting'
  | 'finance.servicePayments.cancel'
  | 'finance.servicePayments.done'
  | 'finance.servicePayments.error'
  | 'finance.servicePayments.refundsTitle'
  | 'business.publicBooking.depositTitle'
  | 'business.publicBooking.depositHint'
  | 'business.publicBooking.depositType'
  | 'business.publicBooking.depositNone'
  | 'business.publicBooking.depositFixed'
  | 'business.publicBooking.depositPercentage'
  | 'business.publicBooking.depositValue'
  | 'business.publicBooking.depositHold'
  | 'business.publicBooking.depositSave'
  | 'business.publicBooking.depositSaving'
  | 'business.publicBooking.depositSaved'
  | 'business.publicBooking.depositUnavailable'
  | 'business.publicBooking.depositInvalid'
  | 'validation.code.invalid_assistant_name'
  | 'field.assistant_name'
  | 'field.assistant_gender'
  | 'serviceForm.name'
  | 'serviceForm.duration'
  | 'serviceForm.primary'
  | 'serviceForm.loading'
  | 'serviceForm.additional'
  | 'serviceForm.hint'
  | 'serviceForm.primaryBadge'
  | 'serviceForm.placeholder'
  | 'serviceForm.create'
  | 'serviceForm.update'
  | 'serviceForm.saveError'
  | 'register.contactRequired'
  | 'register.namePlaceholder'
  | 'employeeForm.passwordInfo'
  | 'employeeForm.created'
  | 'employeeForm.password'
  | 'employeeForm.passwordHint'
  | 'employeeForm.copy'
  | 'employeeForm.copied'
  | 'register.passwordHint'
  | 'register.passwordMismatch'
  | 'register.failed'
  | 'register.creating'
  | 'import.row'
  | 'import.moreErrors'
  | 'import.moreRows'
  | 'visits.saveError'
  | 'visits.loyaltyError'
  | 'dashboard.remaining'
  | 'dashboard.today'
  | 'dashboard.versus'
  | 'inventory.businessRequired'
  | 'finance.businessRequired'
  | 'inventory.createError'

  | 'common.loadError'
  | 'common.retry'
  | 'common.offline'

  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.create'
  | 'common.search'
  | 'common.filter'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.export'
  | 'common.noData'
  | 'common.print'
  | 'export.title'
  | 'export.format'
  | 'export.reportType'
  | 'export.export'
  | 'export.print'
  | 'export.exporting'
  | 'export.error'
  | 'export.includeCharts'
  | 'export.itemsCount'
  | 'export.items'
  | 'export.clientReport'
  | 'export.clientProfile'
  | 'export.clientContacts'
  | 'export.clientVisits'
  | 'export.clientFinance'
  | 'export.visitsReport'
  | 'export.servicesReport'
  | 'export.financeReport'
  | 'export.payments'
  | 'export.revenue'
  | 'export.periods'
  | 'export.employeesReport'
  | 'export.employeeVisits'
  | 'export.employeeServices'
  | 'export.employeeSalary'
  | 'export.analyticsReport'
  | 'export.attendance'
  | 'export.topMetrics'
  | 'export.inventoryReport'
  | 'export.stockRemaining'
  | 'export.movements'
  | 'export.writeoffs'
  | 'export.expensesReport'
  | 'export.expenseItems'
  | 'export.amounts'
  | 'export.selectPeriod'
  | 'export.selectReportType'
  | 'export.period'
  | 'export.fromDate'
  | 'export.toDate'
  | 'export.personalReport'
  | 'export.selectData'
  | 'export.allData'
  | 'export.filteredData'
  | 'export.selectedRows'
  | 'import.title'
  | 'import.selectFile'
  | 'import.fileFormat'
  | 'import.preview'
  | 'import.selectOtherFile'
  | 'import.totalRows'
  | 'import.validRows'
  | 'import.errors'
  | 'import.validationErrors'
  | 'import.status'
  | 'import.error'
  | 'import.ready'
  | 'import.result'
  | 'import.successCount'
  | 'import.skippedCount'
  | 'import.import'
  | 'import.importing'
  | 'import.nameRequired'
  | 'import.invalidEmail'
  | 'import.invalidPhone'
  | 'import.duplicateInFile'
  | 'import.duplicateExists'
  | 'import.emptyFile'
  | 'import.nameColumnNotFound'
  | 'import.parseError'
  | 'import.importWithErrors'
  | 'import.importError'
  | 'specialistType.massage'
  | 'specialistType.cosmetologist'
  | 'specialistType.barber'
  | 'specialistType.hairdresser'
  | 'specialistType.esthetician'
  | 'specialistType.nailTechnician'
  | 'specialistType.lashTechnician'
  | 'specialistType.makeupArtist'
  | 'specialistType.physiotherapist'
  | 'specialistType.nutritionist'
  | 'specialistType.aromatherapist'
  | 'specialistType.fitnessCoach'
  | 'specialistType.yogaInstructor'
  | 'specialistType.psychologist'
  | 'specialistType.psychotherapist'
  | 'specialistType.therapist'
  | 'specialistType.dentist'
  | 'specialistType.dermatologist'
  | 'specialistType.doctor'
  | 'specialistType.cardiologist'
  | 'specialistType.neurologist'
  | 'specialistType.orthopedist'
  | 'specialistType.gynecologist'
  | 'specialistType.urologist'
  | 'specialistType.ophthalmologist'
  | 'specialistType.endocrinologist'
  | 'specialistType.pediatrician'
  | 'specialistType.surgeon'
  | 'specialistType.oncologist'
  | 'category.beauty'
  | 'category.wellness'
  | 'category.healthcare'
  | 'businessType.individual'
  | 'businessType.salon'
  | 'businessType.clinic'
  | 'businessType.medical'
  | 'businessType.dental'
  | 'businessType.hospital'
  | 'businessType.barbershop'
  | 'businessType.rehabCenter'
  | 'register.title'
  | 'register.trial_badge'
  | 'register.trial_desc'
  | 'register.ai_bonus'
  | 'register.fullName'
  | 'register.email'
  | 'register.phone'
  | 'register.password'
  | 'register.confirmPassword'
  | 'register.role'
  | 'role.admin'
  | 'role.businessOwner'
  | 'role.specialist'
  | 'role.employee'
  | 'role.client'
  | 'register.specialistType'
  | 'register.selectSpecialistType'
  | 'register.createAccount'
  | 'register.alreadyHaveAccount'
  | 'register.signIn'
  | 'register.accountCreatedSignIn'
  | 'register.specialistTypeRequired'
  | 'clientForm.allergies'
  | 'clientForm.chronicDiseases'
  | 'clientForm.messageLanguage'
  | 'clientForm.messageLanguageHint'
  | 'clientForm.healthcareRequired'
  | 'clientForm.healthcareRequiredDescription'
  | 'specialistProfile.title'
  | 'specialistProfile.notFound'
  | 'specialistProfile.verificationPending'
  | 'specialistProfile.verified'
  | 'specialistProfile.basicInfo'
  | 'specialistProfile.specialistType'
  | 'specialistProfile.category'
  | 'specialistProfile.specialization'
  | 'specialistProfile.specializationPlaceholder'
  | 'specialistProfile.experience'
  | 'specialistProfile.experienceYears'
  | 'specialistProfile.years'
  | 'specialistProfile.education'
  | 'specialistProfile.educationPlaceholder'
  | 'specialistProfile.certifications'
  | 'specialistProfile.certificationsPlaceholder'
  | 'specialistProfile.businessInfo'
  | 'specialistProfile.businessName'
  | 'specialistProfile.businessType'
  | 'specialistProfile.address'
  | 'specialistProfile.additionalInfo'
  | 'specialistProfile.description'
  | 'specialistProfile.descriptionPlaceholder'
  | 'specialistProfile.languages'
  | 'specialistProfile.languagesPlaceholder'
  | 'nav.dashboard'
  | 'nav.clients'
  | 'nav.visits'
  | 'nav.calendar'
  | 'nav.services'
  | 'nav.waitlist'
  | 'nav.profile'
  | 'nav.logout'
  | 'nav.inventory'
  | 'login.title'
  | 'login.subtitle'
  | 'login.email'
  | 'login.password'
  | 'login.signIn'
  | 'login.loggingIn'
  | 'login.dontHaveAccount'
  | 'login.signUp'
  | 'login.failed'
  | 'dashboard.title'
  | 'dashboard.subtitle'
  | 'dashboard.monthlyRevenue'
  | 'dashboard.monthlyProfit'
  | 'dashboard.monthlyExpenses'
  | 'dashboard.profitMargin'
  | 'dashboard.margin'
  | 'dashboard.thisMonth'
  | 'dashboard.reservations'
  | 'dashboard.totalVisits'
  | 'dashboard.completedVisits'
  | 'dashboard.totalClients'
  | 'dashboard.newClients'
  | 'dashboard.averageSpending'
  | 'dashboard.quickStatus'
  | 'dashboard.noVisits'
  | 'dashboard.noVisitsDescription'
  | 'dashboard.noClients'
  | 'dashboard.noClientsDescription'
  | 'dashboard.noData'
  | 'dashboard.noProfitData'
  | 'clients.title'
  | 'clients.addClient'
  | 'clients.searchPlaceholder'
  | 'clients.allGenders'
  | 'clients.male'
  | 'clients.female'
  | 'clients.other'
  | 'clients.clearFilters'
  | 'clients.noClientsMatch'
  | 'clients.noClientsFound'
  | 'clients.name'
  | 'clients.phone'
  | 'clients.email'
  | 'clients.open'
  | 'clientWorkspace.back'
  | 'clientWorkspace.totalVisits'
  | 'clientWorkspace.completedVisits'
  | 'clientWorkspace.cancelledVisits'
  | 'clientWorkspace.paidTotal'
  | 'clientWorkspace.nextVisit'
  | 'clientWorkspace.noUpcoming'
  | 'clientWorkspace.history'
  | 'clientWorkspace.noVisits'
  | 'clientWorkspace.details'
  | 'clientWorkspace.hideDetails'
  | 'clientWorkspace.questionnaire'
  | 'clientWorkspace.noQuestionnaire'
  | 'clientWorkspace.attachments'
  | 'clientWorkspace.noAttachments'
  | 'clientWorkspace.notes'
  | 'clientWorkspace.noNotes'
  | 'clientWorkspace.notePlaceholder'
  | 'clientWorkspace.addNote'
  | 'clientWorkspace.deleteNoteConfirm'
  | 'clientWorkspace.noteError'
  | 'clientWorkspace.tags'
  | 'clientWorkspace.noTags'
  | 'clientWorkspace.tagPlaceholder'
  | 'clientWorkspace.addTag'
  | 'clientWorkspace.preferences'
  | 'clientWorkspace.preferencesPlaceholder'
  | 'clientWorkspace.saveProfile'
  | 'clientWorkspace.profileError'
  | 'clientWorkspace.forbidden'
  | 'clientWorkspace.dataUnavailable'
  | 'services.title'
  | 'services.addService'
  | 'services.searchPlaceholder'
  | 'services.allServices'
  | 'services.activeOnly'
  | 'services.inactiveOnly'
  | 'services.clearFilters'
  | 'services.noServicesMatch'
  | 'services.noServicesFound'
  | 'services.name'
  | 'services.duration'
  | 'services.price'
  | 'services.status'
  | 'services.active'
  | 'services.inactive'
  | 'services.min'
  | 'visits.title'
  | 'visits.editVisit'
  | 'visits.newVisit'
  | 'visits.searchPlaceholder'
  | 'visits.allStatuses'
  | 'visits.planned'
  | 'visits.inProgress'
  | 'visits.completed'
  | 'visits.cancelled'
  | 'visits.clearFilters'
  | 'visits.fromDate'
  | 'visits.toDate'
  | 'visits.noVisitsMatch'
  | 'visits.noVisitsFound'
  | 'visits.date'
  | 'visits.service'
  | 'visits.specialist'
  | 'visits.status'
  | 'visits.client'
  | 'visits.serviceName'
  | 'visits.startDateTime'
  | 'visits.endDateTime'
  | 'visits.price'
  | 'visits.notes'
  | 'visits.selectClient'
  | 'visits.selectService'
  | 'visits.createVisit'
  | 'visits.updateVisit'
  | 'visits.addService'
  | 'visits.removeService'
  | 'visits.moveServiceUp'
  | 'visits.moveServiceDown'
  | 'visits.chainHint'
  | 'visits.itemsIncomplete'
  | 'visits.chainTotal'
  | 'visits.chainDuration'
  | 'visits.chainEnd'
  | 'visits.selectPaymentMethod'
  | 'visits.paymentOther'
  | 'visits.clientList'
  | 'visits.clientSearch'
  | 'visits.searchClientPlaceholder'
  | 'visits.clientNotFound'
  | 'visits.searching'
  | 'visits.clientFromOtherBusiness'
  | 'visits.addToMyBusiness'
  | 'visits.basicMedicalInfo'
  | 'calendar.view'
  | 'calendar.timeGrid'
  | 'calendar.title'
  | 'calendar.simpleViewDescription'
  | 'calendar.advancedViewDescription'
  | 'calendar.simpleView'
  | 'calendar.advancedView'
  | 'calendar.noVisits'
  | 'calendar.visit'
  | 'calendar.visits'
  | 'calendar.backToCalendar'
  | 'calendar.previous'
  | 'calendar.next'
  | 'calendar.more'
  | 'calendar.monthView'
  | 'calendar.eventsThisMonth'
  | 'calendar.selectedDay'
  | 'calendar.insights'
  | 'calendar.insightsTitle'
  | 'calendar.searchEvents'
  | 'calendar.dayView'
  | 'calendar.dayViewDescription'
  | 'calendar.daySchedule'
  | 'calendar.today'
  | 'calendar.staffColumns'
  | 'calendar.noStaff'
  | 'calendar.weekView'
  | 'calendar.weekViewDescription'
  | 'calendar.chain'
  | 'calendar.chainPosition'
  | 'calendar.chainServices'
  | 'calendar.free'
  | 'calendar.blocked'
  | 'calendar.nonWorking'
  | 'calendar.moveTitle'
  | 'calendar.moveDate'
  | 'calendar.moveTime'
  | 'calendar.moveSubmit'
  | 'calendar.moving'
  | 'calendar.moveConflict'
  | 'calendar.moveError'
  | 'calendar.moveInvalidTime'
  | 'employees.title'
  | 'employees.add_employee'
  | 'employees.search_placeholder'
  | 'employees.active_only'
  | 'employees.employee'
  | 'employees.position'
  | 'employees.commission'
  | 'employees.base_salary'
  | 'employees.status'
  | 'employees.hired_at'
  | 'employees.actions'
  | 'employees.no_employees'
  | 'employees.unknown'
  | 'employees.active'
  | 'employees.inactive'
  | 'employees.edit_employee'
  | 'employees.fire'
  | 'employees.confirm_fire'
  | 'employees.salary'
  | 'employees.form_coming_soon'
  | 'employees.access_denied'
  | 'employees.select_user'
  | 'employees.select_user_placeholder'
  | 'employees.select_user_required'
  | 'employees.no_available_users'
  | 'employees.position_placeholder'
  | 'employees.permissions'
  | 'employees.permission_create_visits'
  | 'employees.permission_edit_clients'
  | 'employees.permission_view_financials'
  | 'employees.permission_manage_services'
  | 'employees.edit_salary'
  | 'employees.search_user'
  | 'employees.no_users_found'
  | 'employees.commission_invalid_range'
  | 'employees.base_salary_invalid'
  | 'salary.my_salary'
  | 'salary.current_unpaid'
  | 'salary.unpaid'
  | 'salary.period'
  | 'salary.total_visits'
  | 'salary.completed'
  | 'salary.total'
  | 'salary.total_revenue'
  | 'salary.total_salary'
  | 'salary.base'
  | 'salary.commission'
  | 'salary.notes'
  | 'salary.calculated_at'
  | 'salary.no_unpaid_salary'
  | 'salary.history'
  | 'salary.visits'
  | 'salary.revenue'
  | 'salary.salary'
  | 'salary.status'
  | 'salary.paid_at'
  | 'salary.cancelled'
  | 'salary.paid'
  | 'salary.access_denied'
  | 'salary.no_history'
  | 'salary.mark_paid'
  | 'salary.mark_paid_confirm'
  | 'salary.calculate_salary'
  | 'salary.calculate_success'
  | 'salary.calculate_error'
  | 'salary.mark_paid_success'
  | 'salary.mark_paid_error'
  | 'salary.view_details'
  | 'salary.calculated_by'
  | 'salary.adjustments'
  | 'salary.adjustments_total'
  | 'salary.total_with_adjustments'
  | 'salary.paid_amount'
  | 'salary.remaining'
  | 'salary.payment_status'
  | 'salary.status.unpaid'
  | 'salary.status.partial'
  | 'salary.status.paid'
  | 'salary.status.completed'
  | 'salary.status.pending'
  | 'salary.status.failed'
  | 'salary.addAdjustment'
  | 'salary.adjustmentType'
  | 'salary.amount'
  | 'salary.description'
  | 'salary.bonus'
  | 'salary.penalty'
  | 'salary.overtime'
  | 'salary.allowance'
  | 'salary.deduction'
  | 'salary.willBeAdded'
  | 'salary.willBeDeducted'
  | 'salary.adjustmentDescription'
  | 'salary.invalidAmount'
  | 'salary.payments'
  | 'salary.recordPayment'
  | 'salary.paymentDate'
  | 'salary.paymentMethod'
  | 'salary.paymentMethod.cash'
  | 'salary.paymentMethod.card'
  | 'salary.paymentMethod.transfer'
  | 'salary.paymentMethod.other'
  | 'salary.allMethods'
  | 'salary.transfer'
  | 'salary.remainingAmount'
  | 'salary.exceedsRemaining'
  | 'salary.paymentNotes'
  | 'salary.completed'
  | 'salary.pending'
  | 'salary.failed'
  | 'salary.deleteAdjustmentConfirm'
  | 'salary.noAdjustments'
  | 'salary.noPayments'
  | 'salary.tabs.current'
  | 'salary.tabs.adjustments'
  | 'salary.tabs.payments'
  | 'salary.tabs.history'
  | 'salary.tabs.details'
  | 'salary.tabs.export'
  | 'salary.currentCalculation'
  | 'salary.currentSalary'
  | 'salary.viewSalaryDetails'
  | 'salary.breakdown'
  | 'salary.bonuses'
  | 'salary.totalVisits'
  | 'salary.totalRevenue'
  | 'salary.periodStart'
  | 'salary.periodEnd'
  | 'salary.calculatedAt'
  | 'salary.noUnpaidSalary'
  | 'salary.noHistory'
  | 'salary.export'
  | 'salary.exportDescription'
  | 'salary.mySalaryReport'
  | 'salary.personalReport'
  | 'salary.deleteAdjustment'
  | 'salary.mySalary'
  | 'salary.fillPeriod'
  | 'salary.selectSalary'
  | 'common.saving'
  | 'common.view'
  | 'nav.business'
  | 'nav.employees'
  | 'nav.my_salary'
  | 'nav.subscription'
  | 'nav.inventory'
  | 'nav.finance'
  | 'nav.analytics'
  | 'nav.loyalty'
  | 'nav.settings'
  | 'nav.notifications'
  | 'nav.collapse_menu'
  | 'nav.expand_menu'
  | 'nav.quick'
  | 'nav.more'
  | 'nav.primary'
  | 'nav.manage'
  | 'nav.system'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.language'
  | 'settings.language_description'
  | 'settings.currency'
  | 'settings.currency_description'
  | 'settings.currency_eur'
  | 'settings.currency_usd'
  | 'settings.currency_czk'
  | 'settings.currency_rub'
  | 'settings.currency_uah'
  | 'settings.saving'
  | 'settings.saved'
  | 'settings.error_saving'
  | 'settings.theme'
  | 'settings.theme_description'
  | 'settings.theme_light'
  | 'settings.theme_dark'
  | 'settings.theme_system'
  | 'settings.timezone'
  | 'settings.timezone_description'
  | 'settings.date_time_format'
  | 'settings.date_format'
  | 'settings.time_format'
  | 'settings.notifications'
  | 'settings.email_notifications'
  | 'settings.email_notifications_description'
  | 'settings.push_notifications'
  | 'settings.push_notifications_description'
  | 'settings.auto_save'
  | 'settings.auto_save_enabled'
  | 'settings.auto_save_description'
  | 'settings.auto_save_interval'
  | 'settings.seconds'
  | 'settings.export_format'
  | 'settings.export_format_description'
  | 'finance.title'
  | 'finance.subtitle'
  | 'finance.revenue'
  | 'finance.expenses'
  | 'finance.profit'
  | 'finance.profit_margin'
  | 'finance.date_from'
  | 'finance.date_to'
  | 'finance.category'
  | 'finance.all_categories'
  | 'finance.add_expense'
  | 'finance.expenses_by_category'
  | 'finance.expenses_list'
  | 'finance.no_expenses'
  | 'finance.date'
  | 'finance.description'
  | 'finance.amount'
  | 'finance.payment_method'
  | 'finance.actions'
  | 'finance.confirm_delete'
  | 'finance.form_coming_soon'
  | 'finance.currency'
  | 'finance.no_category'
  | 'finance.amount_required'
  | 'finance.date_required'
  | 'finance.description_placeholder'
  | 'finance.payment_cash'
  | 'finance.payment_card'
  | 'finance.payment_transfer'
  | 'finance.payment_other'
  | 'finance.payments_volume'
  | 'finance.completed'
  | 'finance.total'
  | 'finance.payment_other'
  | 'subscription.title'
  | 'trial.banner_active'
  | 'trial.banner_cta'
  | 'trial.banner_expired'
  | 'subscription.usage_title'
  | 'subscription.crm_usage'
  | 'subscription.ai_usage'
  | 'subscription.within_limit'
  | 'subscription.limit_exceeded'
  | 'subscription.notRequired'
  | 'subscription.currentSubscription'
  | 'subscription.trialActive'
  | 'subscription.trialEnds'
  | 'subscription.availablePlans'
  | 'subscription.currentPlan'
  | 'subscription.subscribe'
  | 'subscription.noSubscription'
  | 'subscription.selectPlan'
  | 'subscription.noPlansAvailable'
  | 'subscription.contactAdmin'
  | 'subscription.cancel'
  | 'subscription.cancelled'
  | 'subscription.reactivate'
  | 'subscription.pendingCancellation'
  | 'subscription.transactionHistory'
  | 'subscription.history'
  | 'subscription.status_label'
  | 'subscription.status.active'
  | 'subscription.status.cancelled'
  | 'subscription.status.expired'
  | 'subscription.status.past_due'
  | 'subscription.transaction.succeeded'
  | 'subscription.transaction.pending'
  | 'subscription.transaction.failed'
  | 'subscription.transaction.refunded'
  | 'subscription.checkoutUnavailable'
  | 'subscription.checkoutCancelled'
  | 'subscription.checkoutVerifyError'
  | 'subscription.checkoutActive'
  | 'subscription.checkoutPending'
  | 'subscription.checkoutUnpaid'
  | 'subscription.checkoutChecking'
  | 'subscription.checkoutRetry'
  | 'subscription.cancellation_date'
  | 'subscription.days_remaining'
  | 'subscription.trial_period'
  | 'subscription.trial_period_active'
  | 'subscription.period_ends'
  | 'subscription.per_month'
  | 'subscription.per_year'
  | 'subscription.period_days'
  | 'subscription.plan_label'
  | 'subscription.created_label'
  | 'subscription.period_end_label'
  | 'subscription.plan_number'
  | 'subscription.failed_subscribe'
  | 'subscription.failed_cancel'
  | 'subscription.failed_reactivate'
  | 'subscription.active_label'
  | 'inventory.title'
  | 'inventory.add_product'
  | 'inventory.edit_product'
  | 'inventory.name'
  | 'inventory.description'
  | 'inventory.category'
  | 'inventory.quantity'
  | 'inventory.min_quantity'
  | 'inventory.unit'
  | 'inventory.price'
  | 'inventory.barcode'
  | 'inventory.supplier'
  | 'inventory.location'
  | 'inventory.actions'
  | 'inventory.edit'
  | 'inventory.confirm_delete'
  | 'inventory.delete'
  | 'inventory.add_quantity'
  | 'inventory.add_quantity_to'
  | 'inventory.low_stock'
  | 'inventory.low_stock_warning'
  | 'inventory.low_stock_description'
  | 'inventory.low_stock_only'
  | 'inventory.search_placeholder'
  | 'inventory.no_products'
  | 'analytics.title'
  | 'analytics.subtitle'
  | 'analytics.retention'
  | 'analytics.cohorts'
  | 'analytics.trends'
  | 'analytics.forecast'
  | 'analytics.services_specialists'
  | 'analytics.insights'
  | 'analytics.benchmarks'
  | 'analytics.retention_7_days'
  | 'analytics.retention_30_days'
  | 'analytics.retention_90_days'
  | 'analytics.repeat_rate'
  | 'analytics.avg_days_between_visits'
  | 'analytics.total_clients'
  | 'analytics.repeat_clients'
  | 'analytics.cohort_month'
  | 'analytics.trend_metric'
  | 'analytics.trend_comparison'
  | 'analytics.current_value'
  | 'analytics.previous_value'
  | 'analytics.change'
  | 'analytics.change_percent'
  | 'analytics.trend_up'
  | 'analytics.trend_down'
  | 'analytics.trend_stable'
  | 'analytics.forecast_type'
  | 'analytics.forecast_periods'
  | 'analytics.historical_average'
  | 'analytics.last_value'
  | 'analytics.service_name'
  | 'analytics.visit_count'
  | 'analytics.total_revenue'
  | 'analytics.avg_price'
  | 'analytics.unique_clients'
  | 'analytics.ltv_per_client'
  | 'analytics.visits_per_client'
  | 'analytics.specialist_name'
  | 'analytics.avg_check'
  | 'analytics.revenue_per_client'
  | 'analytics.insight_type_info'
  | 'analytics.insight_type_warning'
  | 'analytics.insight_type_success'
  | 'analytics.insight_priority_low'
  | 'analytics.insight_priority_medium'
  | 'analytics.insight_priority_high'
  | 'analytics.benchmarks_available'
  | 'analytics.benchmarks_not_available'
  | 'analytics.business_count'
  | 'analytics.avg_check_benchmark'
  | 'analytics.avg_visits_per_client'
  | 'analytics.avg_retention_rate'
  | 'analytics.avg_daily_load'
  | 'analytics.no_data'
  | 'analytics.loading'
  | 'analytics.date_from'
  | 'analytics.date_to'
  | 'analytics.metric_revenue'
  | 'analytics.metric_clients'
  | 'analytics.metric_visits'
  | 'analytics.metric_average_check'
  | 'analytics.metric_load'
  | 'analytics.comparison_mom'
  | 'analytics.comparison_wow'
  | 'analytics.comparison_yoy'
  | 'analytics.forecast_revenue'
  | 'analytics.forecast_visits'
  | 'loyalty.title'
  | 'loyalty.subtitle'
  | 'loyalty.program_settings'
  | 'loyalty.levels'
  | 'loyalty.promotions'
  | 'loyalty.transactions'
  | 'loyalty.program_type'
  | 'loyalty.program_points'
  | 'loyalty.program_cashback'
  | 'loyalty.program_hybrid'
  | 'loyalty.points_per_currency'
  | 'loyalty.points_name'
  | 'loyalty.currency_per_point'
  | 'loyalty.cashback_percent'
  | 'loyalty.use_levels'
  | 'loyalty.points_expiry_days'
  | 'loyalty.birthday_bonus_enabled'
  | 'loyalty.birthday_bonus_points'
  | 'loyalty.birthday_bonus_percent'
  | 'loyalty.max_bonus_payment_percent'
  | 'loyalty.is_active'
  | 'loyalty.create_program'
  | 'loyalty.edit_program'
  | 'loyalty.delete_program'
  | 'loyalty.add_level'
  | 'loyalty.edit_level'
  | 'loyalty.level_name'
  | 'loyalty.level_number'
  | 'loyalty.min_spending'
  | 'loyalty.points_multiplier'
  | 'loyalty.cashback_multiplier'
  | 'loyalty.benefits'
  | 'loyalty.color'
  | 'loyalty.add_promotion'
  | 'loyalty.edit_promotion'
  | 'loyalty.promotion_name'
  | 'loyalty.promotion_type'
  | 'loyalty.promotion_double_points'
  | 'loyalty.promotion_extra_cashback'
  | 'loyalty.promotion_bonus_points'
  | 'loyalty.promotion_discount'
  | 'loyalty.bonus_points'
  | 'loyalty.discount_percent'
  | 'loyalty.start_date'
  | 'loyalty.end_date'
  | 'loyalty.min_amount'
  | 'loyalty.for_all_clients'
  | 'loyalty.for_specific_client'
  | 'loyalty.client_balance'
  | 'loyalty.points'
  | 'loyalty.cashback'
  | 'loyalty.current_level'
  | 'loyalty.transaction_history'
  | 'loyalty.transaction_type'
  | 'loyalty.transaction_earned'
  | 'loyalty.transaction_spent'
  | 'loyalty.transaction_birthday'
  | 'loyalty.transaction_level_up'
  | 'loyalty.use_points'
  | 'loyalty.points_to_use'
  | 'loyalty.cashback_to_use'
  | 'loyalty.discount_amount'
  | 'loyalty.no_program'
  | 'loyalty.program_not_active'
  | 'loyalty.activate_program'
  | 'loyalty.deactivate_program'
  | 'loyalty.no_levels'
  | 'loyalty.no_promotions'
  | 'loyalty.no_transactions'
  | 'loyalty.service_ids'
  | 'loyalty.service_ids_placeholder'
  | 'common.currency'
  | 'common.close'
  | 'common.days'
  | 'common.actions'
  | 'common.required_field'
  | 'common.error_saving'
  | 'landing.hero.title'
  | 'landing.hero.subtitle'
  | 'landing.hero.badge'
  | 'landing.hero.cta_start'
  | 'landing.hero.cta_login'
  | 'landing.hero.cta_app'
  | 'landing.hero.preview_title'
  | 'landing.hero.preview_slot1'
  | 'landing.hero.preview_slot2'
  | 'landing.features.title'
  | 'landing.features.subtitle'
  | 'landing.features.booking_title'
  | 'landing.features.booking_desc'
  | 'landing.features.calendar_title'
  | 'landing.features.calendar_desc'
  | 'landing.features.clients_title'
  | 'landing.features.clients_desc'
  | 'landing.features.assistant_title'
  | 'landing.features.assistant_desc'
  | 'landing.features.analytics_title'
  | 'landing.features.analytics_desc'
  | 'landing.features.finance_title'
  | 'landing.features.finance_desc'
  | 'landing.tour.title'
  | 'landing.tour.subtitle'
  | 'landing.tour.calendar_tab'
  | 'landing.tour.clients_tab'
  | 'landing.tour.assistant_tab'
  | 'landing.tour.step1_title'
  | 'landing.tour.step1_desc'
  | 'landing.tour.step2_title'
  | 'landing.tour.step2_desc'
  | 'landing.tour.step3_title'
  | 'landing.tour.step3_desc'
  | 'landing.faq.title'
  | 'landing.faq.subtitle'
  | 'landing.faq.q1'
  | 'landing.faq.a1'
  | 'landing.faq.q2'
  | 'landing.faq.a2'
  | 'landing.faq.q3'
  | 'landing.faq.a3'
  | 'landing.faq.q4'
  | 'landing.faq.a4'
  | 'landing.faq.q5'
  | 'landing.faq.a5'
  | 'landing.nav.features'
  | 'landing.nav.tour'
  | 'landing.nav.faq'
  | 'landing.nav.pricing'
  | 'landing.pricing.title'
  | 'landing.pricing.subtitle'
  | 'landing.pricing.crm_tab'
  | 'landing.pricing.ai_tab'
  | 'landing.pricing.per_month'
  | 'landing.pricing.choose_plan'
  | 'landing.pricing.draft_badge'
  | 'landing.pricing.loading'
  | 'landing.pricing.error'
  | 'landing.nav.contact'
  | 'landing.footer.rights'
  | 'landing.footer.privacy'
  | 'landing.footer.terms'
  | 'landing.footer.status_preview'
  | 'landing.footer.contact_support'
  | 'notfound.title'
  | 'notfound.subtitle'
  | 'notfound.to_home'
  | 'notfound.to_app'
  | 'onboarding.welcome.ownerTitle'
  | 'onboarding.welcome.ownerBody'
  | 'onboarding.welcome.soloTitle'
  | 'onboarding.welcome.soloBody'
  | 'onboarding.welcome.staffTitle'
  | 'onboarding.welcome.staffBody'
  | 'onboarding.welcome.start'
  | 'onboarding.welcome.open'
  | 'onboarding.welcome.later'
  | 'onboarding.checklist.expand'
  | 'onboarding.checklist.collapse'
  | 'onboarding.checklist.title'
  | 'onboarding.checklist.description'
  | 'onboarding.checklist.progressLabel'
  | 'onboarding.checklist.hide'
  | 'onboarding.checklist.locked'
  | 'onboarding.checklist.done'
  | 'onboarding.checklist.next'
  | 'onboarding.checklist.allDone'
  | 'onboarding.step.business.title'
  | 'onboarding.step.business.body'
  | 'onboarding.step.business.cta'
  | 'onboarding.step.service.title'
  | 'onboarding.step.service.body'
  | 'onboarding.step.service.cta'
  | 'onboarding.step.staff.title'
  | 'onboarding.step.staff.body'
  | 'onboarding.step.staff.cta'
  | 'onboarding.step.staff.soloTitle'
  | 'onboarding.step.staff.workAlone'
  | 'onboarding.step.schedule.title'
  | 'onboarding.step.schedule.body'
  | 'onboarding.step.schedule.cta'
  | 'onboarding.step.booking.title'
  | 'onboarding.step.booking.body'
  | 'onboarding.step.booking.cta'
  | 'onboarding.step.cancel'
  | 'onboarding.hint.clients.title'
  | 'onboarding.hint.clients.body'
  | 'onboarding.hint.clients.cta'
  | 'onboarding.hint.services.title'
  | 'onboarding.hint.services.body'
  | 'onboarding.hint.services.cta'
  | 'onboarding.hint.calendar.title'
  | 'onboarding.hint.calendar.body'
  | 'onboarding.hint.calendar.cta'
  | 'onboarding.hint.dismiss'
  | 'onboarding.tour.title'
  | 'onboarding.tour.dashboard'
  | 'onboarding.tour.clients'
  | 'onboarding.tour.calendar'
  | 'onboarding.tour.assistant'
  | 'onboarding.tour.dashboardBody'
  | 'onboarding.tour.clientsBody'
  | 'onboarding.tour.calendarBody'
  | 'onboarding.tour.assistantBody'
  | 'onboarding.tour.next'
  | 'onboarding.tour.back'
  | 'onboarding.tour.skip'
  | 'onboarding.tour.done'
  | 'onboarding.settings.title'
  | 'onboarding.settings.description'
  | 'onboarding.settings.showTour'
  | 'onboarding.settings.showChecklist'
  | 'onboarding.settings.saved'
  | 'onboarding.settings.saveError'
  | 'onboarding.error.save'
  | 'nav.schedule'
  | 'schedule.title'
  | 'schedule.subtitle'
  | 'schedule.noAccess'
  | 'schedule.specialist'
  | 'schedule.timezone'
  | 'schedule.tab.weekly'
  | 'schedule.tab.exceptions'
  | 'schedule.tab.rules'
  | 'schedule.weekly.hint'
  | 'schedule.weekday.mon'
  | 'schedule.weekday.tue'
  | 'schedule.weekday.wed'
  | 'schedule.weekday.thu'
  | 'schedule.weekday.fri'
  | 'schedule.weekday.sat'
  | 'schedule.weekday.sun'
  | 'schedule.dayOff'
  | 'schedule.addWindow'
  | 'schedule.start'
  | 'schedule.end'
  | 'schedule.reason'
  | 'schedule.reasonPlaceholder'
  | 'schedule.confirmDelete'
  | 'schedule.error.timeRange'
  | 'schedule.error.bufferRange'
  | 'schedule.error.horizonRange'
  | 'schedule.error.leadRange'
  | 'schedule.error.save'
  | 'schedule.error.load'
  | 'schedule.exceptions.hint'
  | 'schedule.exceptions.title'
  | 'schedule.exceptions.closed'
  | 'schedule.exceptions.closedLabel'
  | 'schedule.exceptions.day'
  | 'schedule.exceptions.add'
  | 'schedule.exceptions.update'
  | 'schedule.exceptions.empty'
  | 'schedule.blocks.title'
  | 'schedule.blocks.hint'
  | 'schedule.blocks.add'
  | 'schedule.blocks.empty'
  | 'schedule.rules.title'
  | 'schedule.rules.hint'
  | 'schedule.rules.noBusiness'
  | 'schedule.rules.timezone'
  | 'schedule.rules.timezoneHint'
  | 'schedule.rules.horizon'
  | 'schedule.rules.horizonHint'
  | 'schedule.rules.lead'
  | 'schedule.rules.leadHint'
  | 'schedule.rules.readOnly'
  | 'schedule.rules.save'
  | 'schedule.rules.saved'
  | 'schedule.buffers.title'
  | 'schedule.buffers.hint'
  | 'schedule.buffers.duration'
  | 'schedule.buffers.before'
  | 'schedule.buffers.after'
  | 'schedule.buffers.empty'
  | 'nav.questionnaires'
  | 'questionnaires.title'
  | 'questionnaires.new'
  | 'questionnaires.emptyTitle'
  | 'questionnaires.emptyDescription'
  | 'questionnaires.fieldsCount'
  | 'questionnaires.service'
  | 'questionnaires.status'
  | 'questionnaires.updated'
  | 'questionnaires.publishedVersion'
  | 'questionnaires.draftOnly'
  | 'questionnaires.noService'
  | 'questionnaires.businessRequired'
  | 'questionnaires.noAccess'
  | 'questionnaires.untitled'
  | 'questionnaires.emptyFields'
  | 'questionnaires.backToList'
  | 'questionnaireEditor.createTitle'
  | 'questionnaireEditor.editTitle'
  | 'questionnaireEditor.name'
  | 'questionnaireEditor.namePlaceholder'
  | 'questionnaireEditor.description'
  | 'questionnaireEditor.descriptionPlaceholder'
  | 'questionnaireEditor.service'
  | 'questionnaireEditor.serviceHint'
  | 'questionnaireEditor.fields'
  | 'questionnaireEditor.fieldsHint'
  | 'questionnaireEditor.add'
  | 'questionnaireEditor.type'
  | 'questionnaireEditor.label'
  | 'questionnaireEditor.labelPlaceholder'
  | 'questionnaireEditor.fieldHint'
  | 'questionnaireEditor.fieldHintPlaceholder'
  | 'questionnaireEditor.required'
  | 'questionnaireEditor.options'
  | 'questionnaireEditor.optionsHint'
  | 'questionnaireEditor.maxSelected'
  | 'questionnaireEditor.maxSelectedHint'
  | 'questionnaireEditor.moveUp'
  | 'questionnaireEditor.moveDown'
  | 'questionnaireEditor.remove'
  | 'questionnaireEditor.keyHint'
  | 'questionnaireEditor.preview'
  | 'questionnaireEditor.hidePreview'
  | 'questionnaireEditor.previewTitle'
  | 'questionnaireEditor.noFields'
  | 'questionnaireEditor.type.text'
  | 'questionnaireEditor.type.long_text'
  | 'questionnaireEditor.type.single_choice'
  | 'questionnaireEditor.type.multi_choice'
  | 'questionnaireEditor.type.boolean'
  | 'questionnaireEditor.answerPlaceholder'
  | 'questionnaireEditor.saveDraft'
  | 'questionnaireEditor.publish'
  | 'questionnaireEditor.publishing'
  | 'questionnaireEditor.saved'
  | 'questionnaireEditor.saveError'
  | 'questionnaireEditor.publishError'
  | 'questionnaireEditor.errorName'
  | 'questionnaireEditor.errorLabel'
  | 'questionnaireEditor.errorOptionsCount'
  | 'questionnaireEditor.errorOptionsDuplicate'
  | 'questionnaireEditor.errorOptionLong'
  | 'questionnaireEditor.errorMaxSelected'
  | 'questionnaireEditor.errorFieldsRequired'
  | 'questionnaireEditor.errorPlainText'
  | 'bookingManage.title'
  | 'bookingManage.unavailableTitle'
  | 'bookingManage.unavailableText'
  | 'bookingManage.loadError'
  | 'bookingManage.actions'
  | 'bookingManage.confirmedAt'
  | 'bookingManage.confirm'
  | 'bookingManage.confirming'
  | 'bookingManage.confirmed'
  | 'bookingManage.confirmError'
  | 'bookingManage.reschedule'
  | 'bookingManage.rescheduleTitle'
  | 'bookingManage.newTime'
  | 'bookingManage.newTimeHint'
  | 'bookingManage.salonTime'
  | 'bookingManage.submitReschedule'
  | 'bookingManage.rescheduling'
  | 'bookingManage.rescheduled'
  | 'bookingManage.rescheduleError'
  | 'bookingManage.cancel'
  | 'bookingManage.cancelQuestion'
  | 'bookingManage.cancelKeep'
  | 'bookingManage.cancelConfirm'
  | 'bookingManage.cancelling'
  | 'bookingManage.cancelled'
  | 'bookingManage.cancelError'
  | 'bookingManage.cutoffNote'
  | 'bookingManage.cutoffReached'
  | 'bookingManage.started'
  | 'bookingManage.linkValidUntil'
  | 'bookingManage.error.timeRequired'
  | 'bookingManage.error.sameTime'
  | 'bookingManage.error.timePast'
  | 'bookingManage.status.planned'
  | 'bookingManage.status.completed'
  | 'bookingManage.status.cancelled'
  | 'bookingManage.status.in_progress'
  | 'notifications.title'
  | 'notifications.description'
  | 'notifications.noAccess'
  | 'notifications.businessRequired'
  | 'notifications.providerReady'
  | 'notifications.providerNotReady'
  | 'notifications.providerNotReadyHint'
  | 'notifications.channel'
  | 'notifications.channelHint'
  | 'notifications.channelNotConnected'
  | 'notifications.enabled'
  | 'notifications.enabledHint'
  | 'notifications.enable'
  | 'notifications.disable'
  | 'notifications.reminderTime'
  | 'notifications.reminderTimeHint'
  | 'notifications.timezone'
  | 'notifications.saved'
  | 'notifications.saveError'
  | 'notifications.testTitle'
  | 'notifications.testDescription'
  | 'notifications.testRun'
  | 'notifications.testRunning'
  | 'notifications.testCaptured'
  | 'notifications.testStatus'
  | 'notifications.testProvider'
  | 'notifications.testRecipient'
  | 'notifications.testSubject'
  | 'notifications.testPreview'
  | 'notifications.testError'
  | 'notifications.delivery.title'
  | 'notifications.delivery.description'
  | 'notifications.delivery.empty'
  | 'notifications.delivery.recipient'
  | 'notifications.delivery.attempts'
  | 'notifications.delivery.error'
  | 'notifications.delivery.retry'
  | 'notifications.delivery.retrying'
  | 'notifications.delivery.retryQueued'
  | 'notifications.delivery.retryError'
  | 'notifications.delivery.statusFilter'
  | 'notifications.delivery.allStatuses'
  | 'notifications.delivery.page'
  | 'notifications.delivery.previous'
  | 'notifications.delivery.next'
  | 'notifications.delivery.loadError'
  | 'notifications.delivery.kind.created'
  | 'notifications.delivery.kind.changed'
  | 'notifications.delivery.kind.cancelled'
  | 'notifications.delivery.kind.reminder'
  | 'notifications.delivery.status.pending'
  | 'notifications.delivery.status.processing'
  | 'notifications.delivery.status.sent'
  | 'notifications.delivery.status.captured'
  | 'notifications.delivery.status.skipped'
  | 'notifications.delivery.status.failed'
  | 'notifications.delivery.status.cancelled'
  | 'questionnairePage.title'
  | 'questionnairePage.linkUnavailableTitle'
  | 'questionnairePage.linkUnavailableText'
  | 'questionnairePage.version'
  | 'questionnairePage.validUntil'
  | 'questionnairePage.draftHint'
  | 'questionnairePage.required'
  | 'questionnairePage.yes'
  | 'questionnairePage.no'
  | 'questionnairePage.maxSelected'
  | 'questionnairePage.textPlaceholder'
  | 'questionnairePage.submit'
  | 'questionnairePage.submitting'
  | 'questionnairePage.submitError'
  | 'questionnairePage.checkAnswers'
  | 'questionnairePage.savedTitle'
  | 'questionnairePage.savedText'
  | 'questionnairePage.alreadySubmittedTitle'
  | 'questionnairePage.alreadySubmittedText'
  | 'questionnairePage.sentAt'
  | 'questionnairePage.error.required'
  | 'questionnairePage.error.tooLong'
  | 'questionnairePage.error.invalidText'
  | 'questionnairePage.error.expectedText'
  | 'questionnairePage.error.invalidOption'
  | 'questionnairePage.error.tooMany'
  | 'questionnairePage.error.duplicate'
  | 'questionnairePage.error.expectedBoolean'
  | 'questionnairePage.error.tooLarge'
  | 'questionnairePage.error.unexpected'
  | 'questionnairePage.error.generic'
  | 'questionnaireAnswers.title'
  | 'questionnaireAnswers.version'
  | 'questionnaireAnswers.submittedAt'
  | 'questionnaireAnswers.noAccess'
  | 'questionnaireAnswers.loadError'
  | 'gift.tab'
  | 'gift.offersTitle'
  | 'gift.offersSubtitle'
  | 'gift.addOffer'
  | 'gift.editOffer'
  | 'gift.name'
  | 'gift.description'
  | 'gift.kind'
  | 'gift.kindMoney'
  | 'gift.kindPackage'
  | 'gift.price'
  | 'gift.faceValue'
  | 'gift.visitsCount'
  | 'gift.validityDays'
  | 'gift.services'
  | 'gift.allServices'
  | 'gift.active'
  | 'gift.inactive'
  | 'gift.save'
  | 'gift.saveError'
  | 'gift.saved'
  | 'gift.noOffers'
  | 'gift.publicLink'
  | 'gift.publicLinkHint'
  | 'gift.needSlug'
  | 'gift.copy'
  | 'gift.copied'
  | 'gift.shopTitle'
  | 'gift.shopSubtitle'
  | 'gift.buy'
  | 'gift.paymentsUnavailable'
  | 'gift.noOffersPublic'
  | 'gift.buyerName'
  | 'gift.buyerEmail'
  | 'gift.recipientName'
  | 'gift.recipientEmail'
  | 'gift.message'
  | 'gift.consent'
  | 'gift.continue'
  | 'gift.purchaseError'
  | 'gift.checkoutTitle'
  | 'gift.checkoutText'
  | 'gift.pay'
  | 'gift.fail'
  | 'gift.alreadySettled'
  | 'gift.returnTitle'
  | 'gift.paidTitle'
  | 'gift.paidText'
  | 'gift.pendingTitle'
  | 'gift.pendingText'
  | 'gift.failedTitle'
  | 'gift.failedText'
  | 'gift.expiredTitle'
  | 'gift.expiredText'
  | 'gift.reconcileTitle'
  | 'gift.reconcileText'
  | 'gift.code'
  | 'gift.codeHint'
  | 'gift.balance'
  | 'gift.visitsLeft'
  | 'gift.validUntil'
  | 'gift.invalidLink'
  | 'gift.loadError'
  | 'gift.checkAgain'
  | 'gift.amountToUse'
  | 'gift.amountHint'
  | 'gift.useGift'
  | 'gift.lookup'
  | 'gift.lookupHint'
  | 'gift.notFound'
  | 'gift.applyError'
  | 'gift.remove'
  | 'gift.loyaltyDisabled'
  | 'gift.savedGiftWarning'
  | 'gift.forService'
  | 'gift.anyService'
  | 'gift.visitsUnit'
  | 'gift.issuedBy'
  | 'gift.recipient'
  | 'gift.status.active'
  | 'gift.status.exhausted'
  | 'gift.status.expired'
  | 'gift.status.cancelled'
  | 'gift.certificatesTitle'
  | 'gift.certificatesSubtitle'
  | 'gift.noCertificates'
  | 'gift.details'
  | 'gift.close'
  | 'gift.reverse'
  | 'gift.reverseConfirm'
  | 'gift.reverseError'
  | 'gift.reverseDone'
  | 'gift.ledger'
  | 'gift.ledger.issued'
  | 'gift.ledger.redeemed'
  | 'gift.ledger.reversed'
  | 'gift.ledger.expired'
  | 'gift.remaining'
  | 'gift.visit'
  | 'gift.buyer'
  | 'gift.statusFilter.all'
  | 'gift.servicesHint'
  | 'gift.payBefore'
  | 'gift.sandboxBadge'
  | 'gift.amountTooHigh'
  | 'gift.scopeMismatch'
  | 'gift.amountDue'
  | 'gift.unusable'
  | 'nav.campaigns'
  | 'campaigns.title'
  | 'campaigns.description'
  | 'campaigns.noAccess'
  | 'campaigns.empty'
  | 'campaigns.selectPrompt'
  | 'campaigns.new'
  | 'campaigns.edit'
  | 'campaigns.editHint'
  | 'campaigns.name'
  | 'campaigns.subject'
  | 'campaigns.body'
  | 'campaigns.bodyHint'
  | 'campaigns.inactiveDays'
  | 'campaigns.inactiveDaysHint'
  | 'campaigns.schedule'
  | 'campaigns.scheduleHint'
  | 'campaigns.create'
  | 'campaigns.creating'
  | 'campaigns.save'
  | 'campaigns.saving'
  | 'campaigns.createError'
  | 'campaigns.saveError'
  | 'campaigns.actionError'
  | 'campaigns.status.draft'
  | 'campaigns.status.confirmed'
  | 'campaigns.status.sending'
  | 'campaigns.status.sent'
  | 'campaigns.status.cancelled'
  | 'campaigns.segmentTitle'
  | 'campaigns.audience'
  | 'campaigns.audienceLive'
  | 'campaigns.audienceFrozen'
  | 'campaigns.audiencePending'
  | 'campaigns.willReceive'
  | 'campaigns.queued'
  | 'campaigns.sampleHint'
  | 'campaigns.noRecipients'
  | 'campaigns.overLimit'
  | 'campaigns.sendReady'
  | 'campaigns.providerNotReady'
  | 'campaigns.notificationsDisabled'
  | 'campaigns.requiresConfirmation'
  | 'campaigns.confirm'
  | 'campaigns.confirmQuestion'
  | 'campaigns.confirmHint'
  | 'campaigns.confirming'
  | 'campaigns.confirmAction'
  | 'campaigns.confirmError'
  | 'campaigns.send'
  | 'campaigns.sendQuestion'
  | 'campaigns.sendHint'
  | 'campaigns.sending'
  | 'campaigns.sendAction'
  | 'campaigns.sendError'
  | 'campaigns.cancel'
  | 'campaigns.cancelQuestion'
  | 'campaigns.cancelling'
  | 'campaigns.cancelAction'
  | 'campaigns.cancelledNotice'
  | 'campaigns.cancelError'
  | 'campaigns.statsTitle'
  | 'campaigns.stat.audience'
  | 'campaigns.stat.queued'
  | 'campaigns.stat.pending'
  | 'campaigns.stat.sent'
  | 'campaigns.stat.captured'
  | 'campaigns.stat.failed'
  | 'campaigns.stat.cancelled'
  | 'campaigns.stat.unsubscribed'
  | 'campaigns.excluded'
  | 'campaigns.noOpens'
  | 'campaigns.fullText'
  | 'campaigns.locked'
  | 'campaigns.previewTitle'
  | 'campaigns.previewError'
  | 'unsubscribe.title'
  | 'unsubscribe.business'
  | 'unsubscribe.address'
  | 'unsubscribe.subscribed'
  | 'unsubscribe.unsubscribed'
  | 'unsubscribe.action'
  | 'unsubscribe.working'
  | 'unsubscribe.done'
  | 'unsubscribe.already'
  | 'unsubscribe.invalid'
  | 'unsubscribe.hint'
  | 'unsubscribe.error'
  | 'unsubscribe.missing'
  | 'unsubscribe.loading'
  | 'unsubscribe.home'
  | 'nav.audit'
  | 'audit.title'
  | 'audit.description'
  | 'audit.readOnly'
  | 'audit.noAccess'
  | 'audit.filters'
  | 'audit.action'
  | 'audit.allActions'
  | 'audit.entity'
  | 'audit.allEntities'
  | 'audit.actor'
  | 'audit.actorPlaceholder'
  | 'audit.actorInvalid'
  | 'audit.dateFrom'
  | 'audit.dateTo'
  | 'audit.dateRangeInvalid'
  | 'audit.apply'
  | 'audit.reset'
  | 'audit.export'
  | 'audit.exporting'
  | 'audit.exportError'
  | 'audit.empty'
  | 'audit.when'
  | 'audit.who'
  | 'audit.what'
  | 'audit.details'
  | 'audit.requestId'
  | 'audit.fieldsChanged'
  | 'audit.createdFields'
  | 'audit.noDetails'
  | 'audit.unknownActor'
  | 'audit.role.admin'
  | 'audit.role.businessOwner'
  | 'audit.role.specialist'
  | 'audit.role.employee'
  | 'audit.role.system'
  | 'audit.role.guest'
  | 'audit.action.visitCreated'
  | 'audit.action.visitUpdated'
  | 'audit.action.visitMoved'
  | 'audit.action.visitCancelled'
  | 'audit.action.paymentPaid'
  | 'audit.action.paymentFailed'
  | 'audit.action.paymentRefunded'
  | 'audit.action.questionnaireSubmitted'
  | 'audit.action.clientUpdated'
  | 'audit.entity.visit'
  | 'audit.entity.payment'
  | 'audit.entity.questionnaire'
  | 'audit.entity.client'
  | 'audit.field.status'
  | 'audit.field.dateStart'
  | 'audit.field.dateEnd'
  | 'audit.field.serviceId'
  | 'audit.field.serviceName'
  | 'audit.field.specialistId'
  | 'audit.field.price'
  | 'audit.field.paymentMethod'
  | 'audit.field.items'
  | 'audit.field.itemsCount'
  | 'audit.field.fullName'
  | 'audit.field.birthDate'
  | 'audit.field.gender'
  | 'audit.field.contactPhone'
  | 'audit.field.contactEmail'
  | 'audit.field.locationLat'
  | 'audit.field.locationLon'
  | 'audit.field.language'
  | 'audit.field.amount'
  | 'audit.field.currency'
  | 'audit.field.provider'
  | 'audit.field.providerEventId'
  | 'audit.field.refundId'
  | 'audit.field.version'
  | 'audit.field.fieldsCount'
  | 'audit.field.answeredCount'
  | 'audit.field.photoUrl'
  | 'audit.field.note'
  | 'nav.import'
  | 'importWizard.title'
  | 'importWizard.description'
  | 'importWizard.noAccess'
  | 'importWizard.uploadTitle'
  | 'importWizard.uploadHint'
  | 'importWizard.selectFile'
  | 'importWizard.replaceFile'
  | 'importWizard.upload'
  | 'importWizard.uploading'
  | 'importWizard.uploadError'
  | 'importWizard.fileTooLarge'
  | 'importWizard.fileEmpty'
  | 'importWizard.fileType'
  | 'importWizard.recent'
  | 'importWizard.recentEmpty'
  | 'importWizard.file'
  | 'importWizard.statusLabel'
  | 'importWizard.rowsLabel'
  | 'importWizard.createdLabel'
  | 'importWizard.open'
  | 'importWizard.batchNotFound'
  | 'importWizard.startOver'
  | 'importWizard.refresh'
  | 'importWizard.steps'
  | 'importWizard.step.upload'
  | 'importWizard.step.mapping'
  | 'importWizard.step.preview'
  | 'importWizard.step.result'
  | 'importWizard.mappingTitle'
  | 'importWizard.mappingHint'
  | 'importWizard.clientFields'
  | 'importWizard.visitFields'
  | 'importWizard.visitHint'
  | 'importWizard.notImported'
  | 'importWizard.target.fullName'
  | 'importWizard.target.phone'
  | 'importWizard.target.email'
  | 'importWizard.target.birthDate'
  | 'importWizard.target.gender'
  | 'importWizard.target.language'
  | 'importWizard.target.visitDate'
  | 'importWizard.target.visitService'
  | 'importWizard.target.visitSpecialist'
  | 'importWizard.target.visitPrice'
  | 'importWizard.target.visitStatus'
  | 'importWizard.target.visitPaymentMethod'
  | 'importWizard.duplicatePolicy'
  | 'importWizard.policy.skip'
  | 'importWizard.policy.update'
  | 'importWizard.policy.create'
  | 'importWizard.mappingRequired'
  | 'importWizard.duplicateColumns'
  | 'importWizard.buildPreview'
  | 'importWizard.previewing'
  | 'importWizard.saveError'
  | 'importWizard.previewTitle'
  | 'importWizard.previewHint'
  | 'importWizard.valid'
  | 'importWizard.errors'
  | 'importWizard.create'
  | 'importWizard.update'
  | 'importWizard.skip'
  | 'importWizard.rebuildPreview'
  | 'importWizard.filterAll'
  | 'importWizard.filterErrors'
  | 'importWizard.row'
  | 'importWizard.actionLabel'
  | 'importWizard.details'
  | 'importWizard.error'
  | 'importWizard.noRows'
  | 'importWizard.rowStatus.pending'
  | 'importWizard.rowStatus.valid'
  | 'importWizard.rowStatus.error'
  | 'importWizard.rowStatus.imported'
  | 'importWizard.rowStatus.skipped'
  | 'importWizard.rowStatus.failed'
  | 'importWizard.action.create'
  | 'importWizard.action.update'
  | 'importWizard.action.skip'
  | 'importWizard.confirmHint'
  | 'importWizard.confirm'
  | 'importWizard.confirming'
  | 'importWizard.confirmError'
  | 'importWizard.outdated'
  | 'importWizard.importingTitle'
  | 'importWizard.importingHint'
  | 'importWizard.lastCheckpoint'
  | 'importWizard.importedSoFar'
  | 'importWizard.continueImport'
  | 'importWizard.resultTitle'
  | 'importWizard.completedWithErrors'
  | 'importWizard.resultSummary'
  | 'importWizard.finishedAt'
  | 'importWizard.downloadReport'
  | 'importWizard.downloading'
  | 'importWizard.reportError'
  | 'importWizard.createsService'
  | 'importWizard.timezoneHint'
  | 'importWizard.currencyHint'
  | 'importWizard.status.uploaded'
  | 'importWizard.status.mapped'
  | 'importWizard.status.previewed'
  | 'importWizard.status.importing'
  | 'importWizard.status.completed'
  | 'importWizard.status.completedWithErrors'
  | 'importWizard.status.failed'
  | 'importWizard.error.requiredField'
  | 'importWizard.error.tooLong'
  | 'importWizard.error.invalidPhone'
  | 'importWizard.error.invalidEmail'
  | 'importWizard.error.invalidDate'
  | 'importWizard.error.invalidChoice'
  | 'importWizard.error.invalidPrice'
  | 'importWizard.error.ambiguousMatch'
  | 'importWizard.error.contactConflict'
  | 'importWizard.error.unknownSpecialist'
  | 'importWizard.error.ambiguousSpecialist'
  | 'importWizard.error.unknownService'
  | 'importWizard.error.ambiguousService'
  | 'importWizard.error.clientMissing'
  | 'importWizard.error.extraColumns'
  | 'importWizard.error.cellTooLong'
  | 'importWizard.error.formulaNotAllowed'
  | 'importWizard.error.malformedRow'
  | 'importWizard.error.rowFailed'

const translations: Record<TranslationKey, Record<'en' | 'ru' | 'cz', string>> = {
  "today.title": {"en": "Today's appointments", "ru": "Записи на сегодня", "cz": "Dnešní návštěvy"},
  "today.empty": {"en": "No appointments today", "ru": "На сегодня записей нет", "cz": "Dnes nejsou žádné návštěvy"},
  "today.noService": {"en": "Service not specified", "ru": "Услуга не указана", "cz": "Služba není uvedena"},
  "today.timeZone": {"en": "Business time zone", "ru": "Часовой пояс бизнеса", "cz": "Časové pásmo podniku"},
  "today.staffUnavailable": {"en": "Specialist names are unavailable. Appointments are still shown.", "ru": "Имена специалистов недоступны. Записи по-прежнему показаны.", "cz": "Jména specialistů nejsou dostupná. Návštěvy se nadále zobrazují."},
  "today.retryStaff": {"en": "Retry names", "ru": "Загрузить имена повторно", "cz": "Znovu načíst jména"},
  "dashboard.overview": {"en": "Business overview", "ru": "Обзор бизнеса", "cz": "Přehled podnikání"},
  "dashboard.visitHistory": {"en": "Visit history", "ru": "История визитов", "cz": "Historie návštěv"},
  "dashboard.openCalendar": {"en": "Open calendar", "ru": "Открыть календарь", "cz": "Otevřít kalendář"},
  'google.title': {"en": "Sign in with Google", "ru": "Вход через Google", "cz": "Přihlášení přes Google"},
  'google.failed': {"en": "Google sign-in failed. Please try again.", "ru": "Не удалось войти через Google. Попробуйте ещё раз.", "cz": "Přihlášení přes Google selhalo. Zkuste to znovu."},
  'google.unavailable': {"en": "Google sign-in is temporarily unavailable. You can still sign in with your password.", "ru": "Вход через Google временно недоступен. Можно войти с паролем.", "cz": "Přihlášení přes Google je dočasně nedostupné. Stále se můžete přihlásit heslem."},
  'google.linkRequired': {"en": "An account with this email already exists. Confirm your password to connect Google to that account.", "ru": "Аккаунт с этой почтой уже существует. Подтвердите пароль, чтобы подключить к нему Google.", "cz": "Účet s tímto e-mailem již existuje. Pro propojení s Google potvrďte heslo."},
  'google.password': {"en": "Your Xtrix account password", "ru": "Пароль вашего аккаунта Xtrix", "cz": "Heslo vašeho účtu Xtrix"},
  'google.linkConsent': {"en": "I want to connect this Google account to my existing Xtrix account.", "ru": "Я хочу подключить этот Google-аккаунт к моему существующему аккаунту Xtrix.", "cz": "Chci propojit tento účet Google se svým stávajícím účtem Xtrix."},
  'google.link': {"en": "Connect Google to my account", "ru": "Подключить Google к моему аккаунту", "cz": "Propojit Google s mým účtem"},
  'pilot.active': {"en": "CRM and AI are free until {date}: 300 visits and 50 AI requests per day.", "ru": "CRM и ИИ бесплатны до {date}: 300 визитов и 50 запросов ИИ в день.", "cz": "CRM a AI jsou zdarma do {date}: 300 návštěv a 50 požadavků AI denně."},
  'pilot.readOnly': {"en": "The trial has ended. Viewing is available until {date}; editing, AI and exports are disabled.", "ru": "Пробный период закончился. Просмотр доступен до {date}; изменения, ИИ и выгрузка отключены.", "cz": "Zkušební období skončilo. Prohlížení je možné do {date}; úpravy, AI a export jsou vypnuty."},
  'pilot.blocked': {"en": "Access to workspace data is paused until a subscription is activated.", "ru": "Доступ к данным кабинета закрыт до подключения подписки.", "cz": "Přístup k datům je pozastaven do aktivace předplatného."},
  'pilot.paymentUnavailable': {"en": "Online payment is not connected yet. No card is required and no payment will be charged during the pilot.", "ru": "Онлайн-оплата пока не подключена. Для пилота карта не нужна, списаний не будет.", "cz": "Online platby zatím nejsou připojeny. Pro pilot nepotřebujete kartu a nic se nestrhne."},
  'pilot.aiOptIn': {"en": "The first paid CRM month includes AI for free. After that, AI requires a separate subscription that you choose to activate; it will not turn paid automatically.", "ru": "Первый оплаченный месяц CRM включает ИИ бесплатно. Затем ИИ подключается отдельной подпиской по вашему выбору — автоматически платным он не станет.", "cz": "První placený měsíc CRM zahrnuje AI zdarma. Poté si AI aktivujete samostatným předplatným; automaticky se placeným nestane."},
  'pilot.unavailable': {"en": "This feature is not available in the pilot yet.", "ru": "Эта функция пока недоступна в пилоте.", "cz": "Tato funkce zatím není v pilotu dostupná."},
  'pilot.invitation': {"en": "The pilot is available by invitation. Sign in with Google using your invited email address.", "ru": "Пилот доступен по приглашению. Войдите через Google с приглашённым адресом почты.", "cz": "Pilot je dostupný na pozvání. Přihlaste se přes Google pomocí pozvaného e-mailu."},
  'pilot.emailUnavailable': {"en": "Email delivery is not connected yet. Password reset by email is currently unavailable.", "ru": "Отправка писем пока не подключена. Восстановление пароля по почте сейчас недоступно.", "cz": "Odesílání e-mailů zatím není připojeno. Obnovení hesla e-mailem není dostupné."},
  'pilot.aiSubscribe': {"en": "Activate a separate AI subscription to use the assistant.", "ru": "Для работы с помощником подключите отдельную подписку ИИ.", "cz": "Pro použití asistenta aktivujte samostatné předplatné AI."},
  'pricing.start': {"en": "Start", "ru": "Старт", "cz": "Start"},
  'pricing.standard': {"en": "Standard", "ru": "Стандарт", "cz": "Standard"},
  'pricing.business': {"en": "Business", "ru": "Бизнес", "cz": "Business"},
  'pricing.largeBusiness': {"en": "Large business", "ru": "Большой бизнес", "cz": "Velký podnik"},
  'pricing.product': {"en": "Choose a product", "ru": "Выберите продукт", "cz": "Vyberte produkt"},
  'pricing.more': {"en": "Show more", "ru": "Показать больше", "cz": "Zobrazit více"},
  'pricing.less': {"en": "Show less", "ru": "Скрыть", "cz": "Zobrazit méně"},
  'pricing.visits': {"en": "Up to {count} visits per month", "ru": "До {count} визитов в месяц", "cz": "Až {count} návštěv měsíčně"},
  'pricing.requests': {"en": "Up to {count} requests per day", "ru": "До {count} запросов в день", "cz": "Až {count} požadavků denně"},
  'pricing.empty': {"en": "No plans are available yet.", "ru": "Тарифы пока недоступны.", "cz": "Tarify zatím nejsou k dispozici."},
  'pricing.try': {"en": "Try free for 7 days", "ru": "Попробовать 7 дней бесплатно", "cz": "Vyzkoušet 7 dní zdarma"},
  'pricing.trial': {"en": "7 days of CRM and AI without a card: 300 visits and 50 AI requests per day. CRM and AI are separate subscriptions.", "ru": "7 дней CRM и ИИ без карты: 300 визитов и 50 запросов ИИ в день. CRM и ИИ — отдельные подписки.", "cz": "7 dní CRM a AI bez karty: 300 návštěv a 50 požadavků AI denně. CRM a AI jsou samostatná předplatná."},
  'pilot.signupClosed': {"en": "Pilot registration is not open yet. Existing users can still sign in.", "ru": "Регистрация в пилот пока закрыта. Существующие пользователи могут войти.", "cz": "Registrace do pilotu zatím není otevřena. Stávající uživatelé se mohou přihlásit."},

  "loyalty.businessRequired": {"en": "Create your business first, the loyalty program belongs to it.", "ru": "Сначала создайте бизнес, программа лояльности привязана к нему.", "cz": "Nejprve vytvořte firmu, věrnostní program k ní patří."},
  "common.item": {"en": "Item", "ru": "Показатель", "cz": "Položka"},
  "common.value": {"en": "Value", "ru": "Значение", "cz": "Hodnota"},
  "subscription.paidByOwner": {"en": "Your plan is paid by the business owner, there is nothing to pay here.", "ru": "Ваш тариф оплачивает владелец бизнеса, здесь ничего платить не нужно.", "cz": "Váš tarif platí majitel firmy, zde nic platit nemusíte."},
  "subscription.ownerPlanInactive": {"en": "The business owner's subscription is not active right now. Ask them to renew it.", "ru": "Подписка владельца бизнеса сейчас не активна. Попросите его продлить её.", "cz": "Předplatné majitele firmy teď není aktivní. Požádejte ho o obnovení."},
  "unit.pcs": {"en": "pcs", "ru": "шт", "cz": "ks"},
  "unit.ml": {"en": "ml", "ru": "мл", "cz": "ml"},
  "unit.l": {"en": "l", "ru": "л", "cz": "l"},
  "unit.g": {"en": "g", "ru": "г", "cz": "g"},
  "unit.kg": {"en": "kg", "ru": "кг", "cz": "kg"},
  "unit.m": {"en": "m", "ru": "м", "cz": "m"},
  "unit.pack": {"en": "pack", "ru": "уп.", "cz": "bal."},
  "expenseCategory.rent": {"en": "Rent", "ru": "Аренда", "cz": "Nájem"},
  "expenseCategory.salaries": {"en": "Salaries", "ru": "Зарплаты", "cz": "Mzdy"},
  "expenseCategory.stock_purchase": {"en": "Stock purchase", "ru": "Закупка товаров", "cz": "Nákup zboží"},
  "expenseCategory.marketing": {"en": "Marketing", "ru": "Маркетинг", "cz": "Marketing"},
  "expenseCategory.utilities": {"en": "Utilities", "ru": "Коммунальные услуги", "cz": "Energie a služby"},
  "expenseCategory.subscriptions": {"en": "Services / Subscriptions", "ru": "Сервисы / Подписки", "cz": "Služby / Předplatné"},
  "expenseCategory.other": {"en": "Other", "ru": "Прочее", "cz": "Ostatní"},
  "expenseSource.salary_payment": {"en": "Salary payment", "ru": "Выплата зарплаты", "cz": "Výplata mzdy"},
  "plan.admin_up_to_3_employees": {"en": "Business: up to 3 employees", "ru": "Бизнес: до 3 сотрудников", "cz": "Firma: až 3 zaměstnanci"},
  "plan.admin_up_to_7_employees": {"en": "Business: up to 7 employees", "ru": "Бизнес: до 7 сотрудников", "cz": "Firma: až 7 zaměstnanců"},
  "plan.admin_up_to_15_employees": {"en": "Business: up to 15 employees", "ru": "Бизнес: до 15 сотрудников", "cz": "Firma: až 15 zaměstnanců"},
  "plan.admin_unlimited_monthly": {"en": "Business: unlimited (monthly)", "ru": "Бизнес: без ограничений (помесячно)", "cz": "Firma: neomezeně (měsíčně)"},
  "plan.admin_unlimited_yearly": {"en": "Business: unlimited (yearly)", "ru": "Бизнес: без ограничений (за год)", "cz": "Firma: neomezeně (ročně)"},
  "plan.solo_basic": {"en": "Solo Basic", "ru": "Solo Basic", "cz": "Solo Basic"},
  "plan.solo_pro": {"en": "Solo Pro", "ru": "Solo Pro", "cz": "Solo Pro"},
  "plan.features.admin_up_to_3_employees": {"en": "Up to 3 employees, all features", "ru": "До 3 сотрудников, все функции", "cz": "Až 3 zaměstnanci, všechny funkce"},
  "plan.features.admin_up_to_7_employees": {"en": "Up to 7 employees, all features", "ru": "До 7 сотрудников, все функции", "cz": "Až 7 zaměstnanců, všechny funkce"},
  "plan.features.admin_up_to_15_employees": {"en": "Up to 15 employees, all features", "ru": "До 15 сотрудников, все функции", "cz": "Až 15 zaměstnanců, všechny funkce"},
  "plan.features.admin_unlimited_monthly": {"en": "Unlimited employees, monthly billing, all features", "ru": "Без ограничений по сотрудникам, оплата помесячно, все функции", "cz": "Neomezeně zaměstnanců, měsíční platba, všechny funkce"},
  "plan.features.admin_unlimited_yearly": {"en": "Unlimited employees, yearly billing with bonus months, all features", "ru": "Без ограничений по сотрудникам, оплата за год с бонусными месяцами, все функции", "cz": "Neomezeně zaměstnanců, roční platba s bonusovými měsíci, všechny funkce"},
  "plan.features.solo_basic": {"en": "Schedule, online booking, clients", "ru": "Расписание, онлайн-запись, клиенты", "cz": "Rozvrh, online rezervace, klienti"},
  "plan.features.solo_pro": {"en": "Everything in Basic + reminders, reports, marketing", "ru": "Всё из Basic + напоминания, отчёты, маркетинг", "cz": "Vše z Basic + připomínky, přehledy, marketing"},
  "clientForm.existsPhone": {"en": "A client with this phone number is already in your list.", "ru": "Клиент с этим номером телефона уже есть в вашем списке.", "cz": "Klient s tímto telefonním číslem už ve vašem seznamu je."},
  "clientForm.existsEmail": {"en": "A client with this email is already in your list.", "ru": "Клиент с этим email уже есть в вашем списке.", "cz": "Klient s tímto e-mailem už ve vašem seznamu je."},
  "clientForm.existsNameBirth": {"en": "A client with this name and date of birth is already in your list.", "ru": "Клиент с таким именем и датой рождения уже есть в вашем списке.", "cz": "Klient s tímto jménem a datem narození už ve vašem seznamu je."},
  "clientForm.exists": {"en": "This client is already in your list.", "ru": "Этот клиент уже есть в вашем списке.", "cz": "Tento klient už ve vašem seznamu je."},
  "clientForm.openExisting": {"en": "Open the existing client", "ru": "Открыть существующего клиента", "cz": "Otevřít existujícího klienta"},
  "import.alreadyInList": {"en": "Already in your list", "ru": "Уже есть в вашем списке", "cz": "Už ve vašem seznamu"},
  "import.openClient": {"en": "Open", "ru": "Открыть", "cz": "Otevřít"},
  "login.twoFactorPrompt": {"en": "Two-factor authentication is on for this account. Enter the 6-digit code from your authenticator app.", "ru": "Для этого аккаунта включена двухфакторная аутентификация. Введите 6-значный код из приложения-аутентификатора.", "cz": "U tohoto účtu je zapnuté dvoufázové ověření. Zadejte 6místný kód z ověřovací aplikace."},
  "login.twoFactorCode": {"en": "Authentication code", "ru": "Код подтверждения", "cz": "Ověřovací kód"},
  "login.twoFactorWrong": {"en": "Wrong code, try again with a fresh one.", "ru": "Неверный код, попробуйте ещё раз со свежим кодом.", "cz": "Nesprávný kód, zkuste to znovu s novým kódem."},
  "login.twoFactorBack": {"en": "Use a different account", "ru": "Войти в другой аккаунт", "cz": "Použít jiný účet"},
  "errors.tooManyRequests": {"en": "Too many requests. Try again in {wait}.", "ru": "Слишком много запросов. Повторите через {wait}.", "cz": "Příliš mnoho požadavků. Zkuste to znovu za {wait}."},
  "errors.tooManyRequestsLater": {"en": "Too many requests. Try again a bit later.", "ru": "Слишком много запросов. Повторите чуть позже.", "cz": "Příliš mnoho požadavků. Zkuste to o něco později."},
  "errors.loginThrottled": {"en": "Too many failed sign-in attempts. Try again in {wait}.", "ru": "Слишком много неудачных попыток входа. Повторите через {wait}.", "cz": "Příliš mnoho neúspěšných pokusů o přihlášení. Zkuste to znovu za {wait}."},
  "errors.loginThrottledLater": {"en": "Too many failed sign-in attempts. Try again a bit later.", "ru": "Слишком много неудачных попыток входа. Повторите чуть позже.", "cz": "Příliš mnoho neúspěšných pokusů o přihlášení. Zkuste to o něco později."},
  "errors.notFound": {"en": "Not found.", "ru": "Не найдено.", "cz": "Nenalezeno."},
  "errors.methodNotAllowed": {"en": "This action is not supported.", "ru": "Это действие не поддерживается.", "cz": "Tato akce není podporována."},
  "errors.subscriptionRequired": {"en": "This action is unavailable until a subscription is activated. Your data is kept.", "ru": "Это действие недоступно до подключения подписки. Ваши данные сохранены.", "cz": "Tato akce není dostupná do aktivace předplatného. Vaše data zůstávají uložena."},
  "errors.visitLimit": {"en": "The monthly limit of {limit} visits has been reached. Cancelled visits do not count.", "ru": "Достигнут месячный лимит: {limit} визитов. Отменённые визиты не учитываются.", "cz": "Byl dosažen měsíční limit {limit} návštěv. Zrušené návštěvy se nepočítají."},
  "time.seconds": {"en": "{n} s", "ru": "{n} с", "cz": "{n} s"},
  "time.minutes": {"en": "{n} min", "ru": "{n} мин", "cz": "{n} min"},
  "validation.code.missing": {"en": "Required field", "ru": "Обязательное поле", "cz": "Povinné pole"},
  "validation.code.empty": {"en": "This field can't be empty", "ru": "Поле не может быть пустым", "cz": "Pole nesmí být prázdné"},
  "validation.code.string_too_short": {"en": "At least {min_length} characters", "ru": "Минимальная длина — {min_length}", "cz": "Minimální délka je {min_length}"},
  "validation.code.string_too_long": {"en": "At most {max_length} characters", "ru": "Максимальная длина — {max_length}", "cz": "Maximální délka je {max_length}"},
  "validation.code.greater_than_equal": {"en": "Must be at least {ge}", "ru": "Должно быть не меньше {ge}", "cz": "Musí být alespoň {ge}"},
  "validation.code.greater_than": {"en": "Must be more than {gt}", "ru": "Должно быть больше {gt}", "cz": "Musí být větší než {gt}"},
  "validation.code.less_than_equal": {"en": "Must be at most {le}", "ru": "Должно быть не больше {le}", "cz": "Musí být nejvýše {le}"},
  "validation.code.less_than": {"en": "Must be less than {lt}", "ru": "Должно быть меньше {lt}", "cz": "Musí být menší než {lt}"},
  "validation.code.number": {"en": "Enter a number", "ru": "Введите число", "cz": "Zadejte číslo"},
  "validation.code.date": {"en": "Enter a valid date", "ru": "Введите корректную дату", "cz": "Zadejte platné datum"},
  "validation.code.date_out_of_range": {"en": "Date must be between {min} and {max}", "ru": "Дата должна быть между {min} и {max}", "cz": "Datum musí být mezi {min} a {max}"},
  "validation.code.invalid_time_range": {"en": "The end must be after the start and the visit no longer than 24 hours", "ru": "Конец должен быть позже начала, а визит не длиннее 24 часов", "cz": "Konec musí být po začátku a návštěva nejdéle 24 hodin"},
  "validation.code.end_before_start": {"en": "The end date can't be before the start date", "ru": "Дата окончания не может быть раньше даты начала", "cz": "Datum konce nemůže být před datem začátku"},
  "validation.code.weak_password": {"en": "Password is too weak: use 8+ characters with upper and lower case letters, a digit and a symbol", "ru": "Слабый пароль: нужно от 8 символов, заглавные и строчные буквы, цифра и спецсимвол", "cz": "Slabé heslo: alespoň 8 znaků, velká i malá písmena, číslice a speciální znak"},
  "validation.code.invalid_phone": {"en": "Invalid phone number, use the international format like +420123456789", "ru": "Неверный номер телефона, используйте международный формат, например +420123456789", "cz": "Neplatné telefonní číslo, použijte mezinárodní formát, např. +420123456789"},
  "validation.code.invalid_email": {"en": "Invalid email address", "ru": "Неверный адрес email", "cz": "Neplatná e-mailová adresa"},
  "validation.code.invalid_birth_date": {"en": "Invalid date of birth", "ru": "Неверная дата рождения", "cz": "Neplatné datum narození"},
  "validation.code.invalid_currency": {"en": "Unknown currency, use an ISO code like EUR or CZK", "ru": "Неизвестная валюта, используйте ISO-код, например EUR или CZK", "cz": "Neznámá měna, použijte kód ISO, např. EUR nebo CZK"},
  "validation.code.invalid_timezone": {"en": "Unknown time zone", "ru": "Неизвестный часовой пояс", "cz": "Neznámé časové pásmo"},
  "validation.code.invalid_choice": {"en": "Choose one of: {allowed}", "ru": "Выберите одно из: {allowed}", "cz": "Vyberte jednu z možností: {allowed}"},
  "validation.code.payment_method_required": {"en": "Choose a payment method for a completed paid visit", "ru": "Выберите способ оплаты для завершённого платного визита", "cz": "U dokončené placené návštěvy vyberte způsob platby"},
  "validation.code.string_type": {"en": "Enter text", "ru": "Введите текст", "cz": "Zadejte text"},
  "validation.code.bool": {"en": "Choose yes or no", "ru": "Выберите да или нет", "cz": "Vyberte ano nebo ne"},
  "field.full_name": {"en": "Name", "ru": "Имя", "cz": "Jméno"},
  "field.name": {"en": "Name", "ru": "Название", "cz": "Název"},
  "field.email": {"en": "Email", "ru": "Email", "cz": "E-mail"},
  "field.phone": {"en": "Phone", "ru": "Телефон", "cz": "Telefon"},
  "field.password": {"en": "Password", "ru": "Пароль", "cz": "Heslo"},
  "field.birth_date": {"en": "Date of birth", "ru": "Дата рождения", "cz": "Datum narození"},
  "field.date_start": {"en": "Start", "ru": "Начало", "cz": "Začátek"},
  "field.date_end": {"en": "End", "ru": "Конец", "cz": "Konec"},
  "field.price": {"en": "Price", "ru": "Цена", "cz": "Cena"},
  "field.amount": {"en": "Amount", "ru": "Сумма", "cz": "Částka"},
  "field.quantity": {"en": "Quantity", "ru": "Количество", "cz": "Množství"},
  "field.base_salary": {"en": "Base salary", "ru": "Оклад", "cz": "Základní mzda"},
  "field.commission_rate": {"en": "Commission", "ru": "Комиссия", "cz": "Provize"},
  "field.currency": {"en": "Currency", "ru": "Валюта", "cz": "Měna"},
  "field.duration_minutes": {"en": "Duration", "ru": "Длительность", "cz": "Délka"},
  "field.unit": {"en": "Unit", "ru": "Единица", "cz": "Jednotka"},
  "validation.price": {"en": "Price must be zero or greater", "ru": "Цена должна быть не меньше нуля", "cz": "Cena musí být nezáporná"},
  "validation.salary": {"en": "Salary must be between 0 and 100000000", "ru": "Зарплата должна быть от 0 до 100000000", "cz": "Mzda musí být v rozmezí 0 až 100000000"},
  "validation.commission": {"en": "Commission must be between 0 and 100", "ru": "Комиссия должна быть от 0 до 100", "cz": "Provize musí být v rozmezí 0 až 100"},
  "validation.visitEnd": {"en": "End time must be after start time", "ru": "Конец визита должен быть позже начала", "cz": "Čas konce musí být pozdější než čas začátku"},
  "visits.savedLoyaltyWarning": {"en": "Visit saved. Loyalty points could not be applied. Check the balance before trying again from the saved visit.", "ru": "Визит сохранён, но списать бонусы не удалось. Проверьте баланс перед повторной попыткой в сохранённом визите.", "cz": "Návštěva byla uložena, ale věrnostní body se nepodařilo uplatnit. Před dalším pokusem v uložené návštěvě zkontrolujte zůstatek."},

  "pagination.previous": {"en": "Previous", "ru": "Назад", "cz": "Předchozí"},
  "pagination.next": {"en": "Next", "ru": "Далее", "cz": "Další"},
  "pagination.range": {"en": "Showing {start}–{end} of {total} results", "ru": "Показано {start}–{end} из {total}", "cz": "Zobrazeno {start}–{end} z {total} záznamů"},
  "pagination.perPage": {"en": "Per page:", "ru": "На странице:", "cz": "Na stránku:"},
  "pagination.label": {"en": "Pagination", "ru": "Страницы", "cz": "Stránkování"},

  "clientForm.fullName": {"en": "Full Name", "ru": "Полное имя", "cz": "Jméno a příjmení"},
  "clientForm.birthDate": {"en": "Date of Birth", "ru": "Дата рождения", "cz": "Datum narození"},
  "clientForm.gender": {"en": "Gender", "ru": "Пол", "cz": "Pohlaví"},
  "clientForm.select": {"en": "Select...", "ru": "Выберите...", "cz": "Vyberte..."},
  "clientForm.phoneHint": {"en": "Enter phone number in international format (e.g., +420 123 456 789)", "ru": "Введите телефон в международном формате (например, +420 123 456 789)", "cz": "Zadejte telefon v mezinárodním formátu (např. +420 123 456 789)"},
  "clientForm.emailHint": {"en": "Enter a valid email address", "ru": "Введите корректный email", "cz": "Zadejte platnou e-mailovou adresu"},
  "clientForm.pregnancy": {"en": "Pregnancy", "ru": "Беременность", "cz": "Těhotenství"},
  "clientForm.personalNotes": {"en": "Personal Notes", "ru": "Личные заметки", "cz": "Osobní poznámky"},
  "clientForm.personalNotesPlaceholder": {"en": "e.g., doesn't like loud sounds, prefers silence", "ru": "Например, не любит громкие звуки, предпочитает тишину", "cz": "Např. nemá rád hlasité zvuky, dává přednost tichu"},
  "clientForm.create": {"en": "Create Client", "ru": "Создать клиента", "cz": "Vytvořit klienta"},
  "clientForm.update": {"en": "Update Client", "ru": "Сохранить клиента", "cz": "Uložit klienta"},
  "clientForm.nameRequired": {"en": "Full Name is required", "ru": "Укажите полное имя", "cz": "Zadejte jméno a příjmení"},
  "clientForm.invalidEmail": {"en": "Invalid email format", "ru": "Неверный формат email", "cz": "Neplatná e-mailová adresa"},
  "clientForm.invalidPhone": {"en": "Invalid phone number format", "ru": "Неверный формат телефона", "cz": "Neplatné telefonní číslo"},
  "clientForm.saveError": {"en": "Failed to save client", "ru": "Не удалось сохранить клиента", "cz": "Klienta se nepodařilo uložit"},
  "business.title": {"en": "My Business", "ru": "Мой бизнес", "cz": "Můj podnik"},
  "business.create": {"en": "Create Business", "ru": "Создать бизнес", "cz": "Vytvořit podnik"},
  "business.edit": {"en": "Edit Business", "ru": "Редактировать бизнес", "cz": "Upravit podnik"},
  "business.update": {"en": "Update Business", "ru": "Сохранить бизнес", "cz": "Uložit podnik"},
  "business.name": {"en": "Business Name", "ru": "Название бизнеса", "cz": "Název podniku"},
  "business.type": {"en": "Business Type", "ru": "Тип бизнеса", "cz": "Typ podniku"},
  "business.address": {"en": "Address", "ru": "Адрес", "cz": "Adresa"},
  "business.description": {"en": "Description", "ru": "Описание", "cz": "Popis"},
  "business.currency": {"en": "Currency", "ru": "Валюта", "cz": "Měna"},
  "business.empty": {"en": "You don't have a business yet.", "ru": "У вас пока нет бизнеса.", "cz": "Zatím nemáte žádný podnik."},
  "business.namePlaceholder": {"en": "e.g., My Beauty Salon", "ru": "Например, мой салон красоты", "cz": "Např. můj kosmetický salon"},
  "business.addressPlaceholder": {"en": "Business address", "ru": "Адрес бизнеса", "cz": "Adresa podniku"},
  "business.descriptionPlaceholder": {"en": "Business description", "ru": "Описание бизнеса", "cz": "Popis podniku"},
  "business.saveError": {"en": "Failed to save business", "ru": "Не удалось сохранить бизнес", "cz": "Podnik se nepodařilo uložit"},
  "business.assistant": {"en": "Assistant", "ru": "Помощник", "cz": "Asistent"},
  "business.assistantHint": {"en": "The assistant in the app goes by this name. Leave it empty for the default name in each user's language.", "ru": "Так помощника зовут в приложении. Оставьте пустым — будет имя по умолчанию на языке каждого пользователя.", "cz": "Takto se asistent v aplikaci jmenuje. Když pole necháte prázdné, použije se výchozí jméno v jazyce každého uživatele."},
  "business.assistantName": {"en": "Assistant name", "ru": "Имя помощника", "cz": "Jméno asistenta"},
  "business.assistantGender": {"en": "Gender in phrases", "ru": "Род в фразах", "cz": "Rod ve větách"},
  "business.assistantGender.female": {"en": "Female (she)", "ru": "Женский (записала)", "cz": "Ženský (zapsala)"},
  "business.assistantGender.male": {"en": "Male (he)", "ru": "Мужской (записал)", "cz": "Mužský (zapsal)"},
  "business.assistantGender.neuter": {"en": "Neuter (it)", "ru": "Средний (записало)", "cz": "Střední (zapsalo)"},
  "business.assistantDefault": {"en": "default", "ru": "по умолчанию", "cz": "výchozí"},
  "business.assistantNameTooLong": {"en": "Up to 30 characters", "ru": "Не больше 30 символов", "cz": "Nejvýše 30 znaků"},
  "business.assistantNameInvalid": {"en": "No line breaks or special characters", "ru": "Без переносов строк и спецсимволов", "cz": "Bez zalomení řádků a speciálních znaků"},
  "business.publicBooking.title": {"en": "Online booking link", "ru": "Ссылка на онлайн-запись", "cz": "Odkaz na online rezervaci"},
  "business.publicBooking.description": {"en": "Share this link with clients so they can book without an account.", "ru": "Поделитесь ссылкой с клиентами — они смогут записаться без аккаунта.", "cz": "Sdílejte odkaz s klienty — mohou se rezervovat bez účtu."},
  "business.publicBooking.enabled": {"en": "Online booking is on", "ru": "Онлайн-запись включена", "cz": "Online rezervace je zapnutá"},
  "business.publicBooking.disabled": {"en": "Online booking is off", "ru": "Онлайн-запись выключена", "cz": "Online rezervace je vypnutá"},
  "business.publicBooking.enable": {"en": "Turn on booking", "ru": "Включить запись", "cz": "Zapnout rezervace"},
  "business.publicBooking.disable": {"en": "Turn off booking", "ru": "Выключить запись", "cz": "Vypnout rezervace"},
  "business.publicBooking.saving": {"en": "Saving…", "ru": "Сохраняю…", "cz": "Ukládám…"},
  "business.publicBooking.saveError": {"en": "Couldn't change the booking link", "ru": "Не удалось изменить ссылку записи", "cz": "Odkaz rezervace se nepodařilo změnit"},
  "business.publicBooking.link": {"en": "Public link", "ru": "Публичная ссылка", "cz": "Veřejný odkaz"},
  "business.publicBooking.copy": {"en": "Copy link", "ru": "Скопировать ссылку", "cz": "Kopírovat odkaz"},
  "business.publicBooking.copied": {"en": "Copied", "ru": "Скопировано", "cz": "Zkopírováno"},
  "business.publicBooking.copyError": {"en": "Couldn't copy — select the link and copy it manually", "ru": "Не удалось скопировать — выделите ссылку и скопируйте вручную", "cz": "Kopírování se nepodařilo — odkaz vyberte a zkopírujte ručně"},
  "business.publicBooking.ready": {"en": "Ready to accept bookings", "ru": "Ссылка готова принимать записи", "cz": "Odkaz může přijímat rezervace"},
  "business.publicBooking.notReady": {"en": "Not ready for bookings yet", "ru": "Ссылка пока не готова к записи", "cz": "Odkaz zatím není připraven k rezervacím"},
  "business.publicBooking.servicesReady": {"en": "There is a bookable service with a master", "ru": "Есть активная услуга с мастером", "cz": "Existuje aktivní služba s mistrem"},
  "business.publicBooking.servicesMissing": {"en": "No active service with a duration and a master", "ru": "Нет активной услуги с длительностью и мастером", "cz": "Chybí aktivní služba s délkou a mistrem"},
  "business.publicBooking.scheduleReady": {"en": "The master has working hours", "ru": "У мастера заполнен график", "cz": "Mistr má vyplněný rozvrh"},
  "business.publicBooking.scheduleMissing": {"en": "The master has no working hours", "ru": "У мастера нет рабочего графика", "cz": "Mistr nemá pracovní rozvrh"},
  "business.publicBooking.setupServices": {"en": "Set up services", "ru": "Настроить услуги", "cz": "Nastavit služby"},
  "business.publicBooking.setupSchedule": {"en": "Set up working hours", "ru": "Настроить график", "cz": "Nastavit rozvrh"},
  "business.publicBooking.disabledHint": {"en": "Guests opening the link see that booking is unavailable.", "ru": "Гости по ссылке увидят, что запись недоступна.", "cz": "Hosté přes odkaz uvidí, že rezervace není dostupná."},
  "business.publicBooking.enabledNotReady": {"en": "The link is on, but guests won't see any free times until the checklist is complete.", "ru": "Ссылка включена, но свободных окон не будет, пока не выполнены условия выше.", "cz": "Odkaz je zapnutý, ale hosté neuvidí volné termíny, dokud nebudou podmínky splněné."},
  "booking.title": {"en": "Online booking", "ru": "Онлайн-запись", "cz": "Online rezervace"},
  "booking.servicesTitle": {"en": "Services and prices", "ru": "Услуги и цены", "cz": "Služby a ceny"},
  "booking.noServices": {"en": "Online booking is not available yet. Please contact the salon directly.", "ru": "Онлайн-запись пока недоступна. Свяжитесь с салоном напрямую.", "cz": "Online rezervace zatím není dostupná. Kontaktujte prosím salon přímo."},
  "booking.priceOnRequest": {"en": "Price on request", "ru": "Цена по запросу", "cz": "Cena na vyžádání"},
  "booking.unavailableTitle": {"en": "Booking link is not active", "ru": "Ссылка на запись неактивна", "cz": "Odkaz pro rezervaci není aktivní"},
  "booking.unavailableText": {"en": "Check the address or contact the salon. If the salon sent you this link, online booking may be turned off.", "ru": "Проверьте адрес или свяжитесь с салоном. Если ссылку прислал салон, онлайн-запись может быть выключена.", "cz": "Zkontrolujte adresu nebo kontaktujte salon. Pokud vám odkaz poslal salon, online rezervace může být vypnutá."},
  "booking.contacts": {"en": "Contacts", "ru": "Контакты", "cz": "Kontakty"},
  "booking.noAccount": {"en": "No account needed", "ru": "Без регистрации и пароля", "cz": "Bez registrace a hesla"},
  "booking.chooseService": {"en": "Choose a service", "ru": "Выберите услугу", "cz": "Vyberte službu"},
  "booking.multiHint": {"en": "You can pick several services — they run one after another.", "ru": "Можно выбрать несколько услуг — они идут одна за другой.", "cz": "Můžete vybrat několik služeb — půjdou jedna po druhé."},
  "booking.selectedServices": {"en": "Selected services", "ru": "Выбранные услуги", "cz": "Vybrané služby"},
  "booking.clearSelection": {"en": "Clear", "ru": "Очистить", "cz": "Vymazat"},
  "booking.selectedCount": {"en": "{n} selected", "ru": "Выбрано: {n}", "cz": "Vybráno: {n}"},
  "booking.chainTotal": {"en": "Total", "ru": "Итого", "cz": "Celkem"},
  "booking.chainDuration": {"en": "Total duration", "ru": "Общая длительность", "cz": "Celková délka"},
  "booking.chainForOneMaster": {"en": "All selected services are performed by one master, back to back.", "ru": "Все выбранные услуги выполняет один мастер подряд.", "cz": "Všechny vybrané služby provádí jeden specialista po sobě."},
  "booking.chooseMaster": {"en": "Choose a master", "ru": "Выберите мастера", "cz": "Vyberte specialistu"},
  "booking.chooseTime": {"en": "Choose a date and time", "ru": "Выберите дату и время", "cz": "Vyberte datum a čas"},
  "booking.anyMaster": {"en": "Any available master", "ru": "Любой свободный мастер", "cz": "Jakýkoli volný specialista"},
  "booking.noStaff": {"en": "No masters are available for this service right now.", "ru": "Для этой услуги сейчас нет доступных мастеров.", "cz": "Pro tuto službu nyní nejsou dostupní žádní specialisté."},
  "booking.noSlots": {"en": "No free times in the next two weeks.", "ru": "В ближайшие две недели свободных окон нет.", "cz": "V příštích dvou týdnech nejsou volné termíny."},
  "booking.onlyFreeTimes": {"en": "Only free times are shown.", "ru": "Показаны только свободные окна.", "cz": "Zobrazeny jsou pouze volné termíny."},
  "booking.timezone": {"en": "Salon time zone", "ru": "Часовой пояс салона", "cz": "Časové pásmo salonu"},
  "booking.back": {"en": "Back", "ru": "Назад", "cz": "Zpět"},
  "booking.yourDetails": {"en": "Your details", "ru": "Ваши данные", "cz": "Vaše údaje"},
  "booking.contactHint": {"en": "Leave a phone or an email — one contact is enough.", "ru": "Оставьте телефон или email — достаточно одного контакта.", "cz": "Zanechte telefon nebo e-mail — stačí jeden kontakt."},
  "booking.nameRequired": {"en": "Enter your name", "ru": "Укажите имя", "cz": "Zadejte své jméno"},
  "booking.contactRequired": {"en": "Enter a phone number or an email", "ru": "Укажите телефон или email", "cz": "Zadejte telefon nebo e-mail"},
  "booking.contactOnlyOne": {"en": "Leave only one contact: a phone number or an email", "ru": "Оставьте только один контакт: телефон или email", "cz": "Zanechte pouze jeden kontakt: telefon nebo e-mail"},
  "booking.invalidEmail": {"en": "Check the email address", "ru": "Проверьте адрес email", "cz": "Zkontrolujte e-mailovou adresu"},
  "booking.invalidPhone": {"en": "Check the phone number", "ru": "Проверьте номер телефона", "cz": "Zkontrolujte telefonní číslo"},
  "booking.phoneHint": {"en": "International format, e.g. +420777123456", "ru": "Международный формат, например +420777123456", "cz": "Mezinárodní formát, např. +420777123456"},
  "booking.processingConsent": {"en": "I agree that the salon may process my details to create and manage this booking.", "ru": "Согласен(на), что салон обработает мои данные для создания записи и связи со мной.", "cz": "Souhlasím, aby salon zpracoval mé údaje pro vytvoření rezervace a kontakt se mnou."},
  "booking.processingConsentRequired": {"en": "Please agree to the processing of your details", "ru": "Подтвердите согласие на обработку данных", "cz": "Potvrďte souhlas se zpracováním údajů"},
  "booking.marketingConsent": {"en": "I agree to receive offers and news from the salon. Optional.", "ru": "Согласен(на) получать предложения и новости салона. Необязательно.", "cz": "Souhlasím se zasíláním nabídek a novinek salonu. Nepovinné."},
  "booking.continue": {"en": "Continue", "ru": "Продолжить", "cz": "Pokračovat"},
  "booking.summary": {"en": "Check your booking", "ru": "Проверьте запись", "cz": "Zkontrolujte rezervaci"},
  "booking.service": {"en": "Service", "ru": "Услуга", "cz": "Služba"},
  "booking.master": {"en": "Master", "ru": "Мастер", "cz": "Specialista"},
  "booking.dateTime": {"en": "Date and time", "ru": "Дата и время", "cz": "Datum a čas"},
  "booking.price": {"en": "Price", "ru": "Стоимость", "cz": "Cena"},
  "booking.contact": {"en": "Contact", "ru": "Контакт", "cz": "Kontakt"},
  "booking.confirm": {"en": "Confirm booking", "ru": "Подтвердить запись", "cz": "Potvrdit rezervaci"},
  "booking.submitting": {"en": "Sending...", "ru": "Отправляем...", "cz": "Odesílám..."},
  "booking.chooseAnotherTime": {"en": "Choose another time", "ru": "Выбрать другое время", "cz": "Vybrat jiný čas"},
  "booking.waitlist.cta": {"en": "Join the waitlist", "ru": "Встать в лист ожидания", "cz": "Zařadit se na seznam čekatelů"},
  "booking.waitlist.noSlotsHint": {"en": "You can leave a request — the salon will email you if a matching time frees up.", "ru": "Можно оставить заявку — салон напишет на email, если подходящее время освободится.", "cz": "Můžete zanechat žádost — salon vám napíše e-mailem, když se uvolní vhodný termín."},
  "booking.waitlist.title": {"en": "Waitlist request", "ru": "Заявка в лист ожидания", "cz": "Žádost do seznamu čekatelů"},
  "booking.waitlist.notBooking": {"en": "This is not a booking and does not hold a time.", "ru": "Это не запись и не резерв времени.", "cz": "Toto není rezervace ani rezervace času."},
  "booking.waitlist.explanation": {"en": "If a suitable slot frees up, you may get a time-limited offer by email. The time is not held for you until you accept it.", "ru": "Если подходящее окно освободится, на email придёт предложение с ограниченным сроком. До подтверждения время за вами не закреплено.", "cz": "Když se uvolní vhodný termín, přijde vám e-mailem nabídka s omezenou platností. Do potvrzení není čas pro vás blokován."},
  "booking.waitlist.join": {"en": "Send request", "ru": "Отправить заявку", "cz": "Odeslat žádost"},
  "booking.waitlist.decline": {"en": "Don't join", "ru": "Не вставать", "cz": "Nezařazovat se"},
  "booking.waitlist.joinedTitle": {"en": "Request saved", "ru": "Заявка сохранена", "cz": "Žádost uložena"},
  "booking.waitlist.joinedText": {"en": "The salon will see your preferences. If a matching time frees up, you may receive an email with a time-limited offer.", "ru": "Салон увидит ваши пожелания. Если подходящее время освободится, вы можете получить письмо с предложением на ограниченный срок.", "cz": "Salon uvidí vaše preference. Pokud se uvolní vhodný termín, můžete dostat e-mail s nabídkou na omezenou dobu."},
  "booking.waitlist.leave": {"en": "Leave the waitlist", "ru": "Убрать заявку", "cz": "Odebrat žádost"},
  "booking.waitlist.leftTitle": {"en": "You left the waitlist", "ru": "Вы убрали заявку", "cz": "Žádost byla odebrána"},
  "booking.waitlist.leftText": {"en": "No new offers will be sent for this request.", "ru": "Новые предложения по этой заявке приходить не будут.", "cz": "Pro tuto žádost už nebudou chodit nové nabídky."},
  "booking.waitlist.emailRequired": {"en": "Enter an email to receive an offer", "ru": "Укажите email, чтобы получить предложение", "cz": "Zadejte e-mail pro zaslání nabídky"},
  "booking.waitlist.dateRange": {"en": "Check the preferred dates", "ru": "Проверьте желаемые даты", "cz": "Zkontrolujte požadované termíny"},
  "booking.waitlist.timePreference": {"en": "Preferred time of day", "ru": "Желаемое время", "cz": "Preferovaný čas"},
  "booking.waitlist.timeAny": {"en": "Any time", "ru": "Любое", "cz": "Jakýkoli"},
  "booking.waitlist.timeMorning": {"en": "Morning (before 12)", "ru": "Утро (до 12)", "cz": "Ráno (do 12)"},
  "booking.waitlist.timeAfternoon": {"en": "Afternoon (12–17)", "ru": "День (12–17)", "cz": "Odpoledne (12–17)"},
  "booking.waitlist.timeEvening": {"en": "Evening (after 17)", "ru": "Вечер (после 17)", "cz": "Večer (po 17)"},
  "booking.waitlist.dateFrom": {"en": "Earliest date", "ru": "Дата с", "cz": "Datum od"},
  "booking.waitlist.dateTo": {"en": "Latest date", "ru": "Дата по", "cz": "Datum do"},
  "booking.waitlist.processingConsent": {"en": "I agree that the salon may process my details to contact me about this waitlist request.", "ru": "Согласен(на), что салон обработает мои данные, чтобы связаться со мной по этой заявке.", "cz": "Souhlasím, aby salon zpracoval mé údaje pro kontakt ohledně této žádosti."},
  "waitlist.title": {"en": "Waitlist", "ru": "Лист ожидания", "cz": "Seznam čekatelů"},
  "waitlist.subtitle": {"en": "Requests are preferences, not bookings. When a slot frees up, matching guests receive a time-limited offer by email.", "ru": "Заявки — это пожелания, а не записи. Когда окно освобождается, подходящие гости получают письмо с предложением на ограниченный срок.", "cz": "Žádosti jsou preference, ne rezervace. Když se uvolní termín, vhodní hosté dostanou e-mailem nabídku s omezenou platností."},
  "waitlist.filter.status": {"en": "Status", "ru": "Статус", "cz": "Stav"},
  "waitlist.filter.service": {"en": "Service", "ru": "Услуга", "cz": "Služba"},
  "waitlist.filter.anyService": {"en": "All services", "ru": "Все услуги", "cz": "Všechny služby"},
  "waitlist.filter.dateFrom": {"en": "Preferences from", "ru": "Пожелания с", "cz": "Preference od"},
  "waitlist.filter.dateTo": {"en": "Preferences to", "ru": "Пожелания по", "cz": "Preference do"},
  "waitlist.filter.reset": {"en": "Reset filters", "ru": "Сбросить фильтры", "cz": "Zrušit filtry"},
  "waitlist.status.all": {"en": "All statuses", "ru": "Все статусы", "cz": "Všechny stavy"},
  "waitlist.status.active": {"en": "Active", "ru": "Активна", "cz": "Aktivní"},
  "waitlist.status.cancelled": {"en": "Closed", "ru": "Закрыта", "cz": "Uzavřená"},
  "waitlist.status.fulfilled": {"en": "Booked", "ru": "Записана", "cz": "Rezervováno"},
  "waitlist.offer.pending": {"en": "Offer waiting", "ru": "Ожидает ответа", "cz": "Nabídka čeká"},
  "waitlist.offer.accepted": {"en": "Offer accepted", "ru": "Предложение принято", "cz": "Nabídka přijata"},
  "waitlist.offer.declined": {"en": "Offer declined", "ru": "Предложение отклонено", "cz": "Nabídka odmítnuta"},
  "waitlist.offer.expired": {"en": "Offer expired", "ru": "Предложение истекло", "cz": "Nabídka vypršela"},
  "waitlist.offer.conflict": {"en": "Time taken", "ru": "Время занято", "cz": "Čas obsazen"},
  "waitlist.empty": {"en": "No waitlist requests match these filters.", "ru": "По этим фильтрам заявок нет.", "cz": "Těmto filtrům neodpovídají žádné žádosti."},
  "waitlist.table.guest": {"en": "Guest", "ru": "Гость", "cz": "Host"},
  "waitlist.table.preferences": {"en": "Preferences", "ru": "Пожелания", "cz": "Preference"},
  "waitlist.table.offer": {"en": "Latest offer", "ru": "Последнее предложение", "cz": "Poslední nabídka"},
  "waitlist.table.created": {"en": "Created", "ru": "Создана", "cz": "Vytvořeno"},
  "waitlist.table.actions": {"en": "Actions", "ru": "Действия", "cz": "Akce"},
  "waitlist.table.expires": {"en": "Expires", "ru": "Действует до", "cz": "Platí do"},
  "waitlist.table.noOffer": {"en": "No offers yet", "ru": "Предложений ещё не было", "cz": "Zatím žádná nabídka"},
  "waitlist.cancel": {"en": "Close request", "ru": "Закрыть заявку", "cz": "Uzavřít žádost"},
  "waitlist.cancelConfirm": {"en": "Close this waitlist request? No new offers will be sent.", "ru": "Закрыть эту заявку? Новые предложения приходить не будут.", "cz": "Uzavřít tuto žádost? Nové nabídky už nebudou zasílány."},
  "waitlistOffer.title": {"en": "Waitlist offer", "ru": "Предложение из листа ожидания", "cz": "Nabídka ze seznamu čekatelů"},
  "waitlistOffer.subtitle": {"en": "A free time matched your waitlist request. Review it and confirm if it suits you.", "ru": "Освободилось время по вашей заявке в листе ожидания. Проверьте его и подтвердите, если подходит.", "cz": "Uvolnil se čas odpovídající vaší žádosti. Zkontrolujte jej a potvrďte, pokud vám vyhovuje."},
  "waitlistOffer.unavailableTitle": {"en": "Offer is not available", "ru": "Предложение недоступно", "cz": "Nabídka není dostupná"},
  "waitlistOffer.unavailableText": {"en": "The link is invalid, has expired, or the offer was already answered. Ask the salon to add you to the waitlist again.", "ru": "Ссылка недействительна, истекла или на предложение уже ответили. Попросите салон добавить вас в лист ожидания снова.", "cz": "Odkaz je neplatný, vypršel nebo už na nabídku bylo odpovězeno. Požádejte salon, aby vás znovu zařadil do seznamu čekatelů."},
  "waitlistOffer.loadError": {"en": "Couldn't load the offer", "ru": "Не удалось загрузить предложение", "cz": "Nabídku se nepodařilo načíst"},
  "waitlistOffer.notReserved": {"en": "This time is not reserved for you. It stays open to everyone until you accept the offer.", "ru": "Это время за вами не закреплено. Оно остаётся свободным для всех, пока вы не примете предложение.", "cz": "Tento čas pro vás není blokován. Zůstává volný pro všechny, dokud nabídku nepřijmete."},
  "waitlistOffer.expires": {"en": "Offer valid until", "ru": "Предложение действует до", "cz": "Nabídka platí do"},
  "waitlistOffer.accept": {"en": "Book this time", "ru": "Записаться на это время", "cz": "Rezervovat tento čas"},
  "waitlistOffer.accepting": {"en": "Booking...", "ru": "Записываю...", "cz": "Rezervuji..."},
  "waitlistOffer.decline": {"en": "Not this time", "ru": "Не подходит", "cz": "Tentokrát ne"},
  "waitlistOffer.declining": {"en": "Sending...", "ru": "Отправляю...", "cz": "Odesílám..."},
  "waitlistOffer.acceptedTitle": {"en": "You are booked", "ru": "Вы записаны", "cz": "Rezervace potvrzena"},
  "waitlistOffer.acceptedText": {"en": "The time is now yours. The salon will contact you using the details from your waitlist request.", "ru": "Время закреплено за вами. Салон свяжется с вами по контактам из заявки.", "cz": "Čas je nyní váš. Salon vás bude kontaktovat na údaje z vaší žádosti."},
  "waitlistOffer.declinedTitle": {"en": "Offer declined", "ru": "Предложение отклонено", "cz": "Nabídka odmítnuta"},
  "waitlistOffer.declinedText": {"en": "Your waitlist request stays active, and you may receive another offer if a suitable time frees up.", "ru": "Заявка в листе ожидания остаётся активной — вы можете получить новое предложение, если подходящее время освободится.", "cz": "Vaše žádost zůstává aktivní a můžete dostat další nabídku, když se uvolní vhodný čas."},
  "waitlistOffer.closedText": {"en": "This offer can no longer be accepted. Ask the salon if you would like to join the waitlist again.", "ru": "Это предложение больше нельзя принять. Спросите салон, если хотите снова встать в лист ожидания.", "cz": "Tuto nabídku už nelze přijmout. Pokud se chcete znovu zařadit, kontaktujte salon."},
  "waitlistOffer.actionError": {"en": "Couldn't complete the action. Try again.", "ru": "Не удалось выполнить действие. Попробуйте ещё раз.", "cz": "Akci se nepodařilo dokončit. Zkuste to znovu."},
  "waitlistOffer.status.accepted": {"en": "Offer already accepted", "ru": "Предложение уже принято", "cz": "Nabídka již přijata"},
  "waitlistOffer.status.declined": {"en": "Offer declined", "ru": "Предложение отклонено", "cz": "Nabídka odmítnuta"},
  "waitlistOffer.status.expired": {"en": "Offer expired", "ru": "Предложение истекло", "cz": "Nabídka vypršela"},
  "waitlistOffer.status.conflict": {"en": "Time is already taken", "ru": "Время уже занято", "cz": "Čas je již obsazen"},
  "waitlistOffer.status.cancelled": {"en": "Offer cancelled", "ru": "Предложение отменено", "cz": "Nabídka zrušena"},
  "booking.successTitle": {"en": "You are booked", "ru": "Вы записаны", "cz": "Rezervace potvrzena"},
  "booking.successText": {"en": "The salon will contact you using the details you left. No email confirmation is sent automatically.", "ru": "Салон свяжется с вами по оставленным контактам. Письмо-подтверждение автоматически не отправляется.", "cz": "Salon vás bude kontaktovat na uvedené údaje. Potvrzovací e-mail se automaticky neposílá."},
  "booking.bookingNumber": {"en": "Booking number", "ru": "Номер записи", "cz": "Číslo rezervace"},
  "booking.newBooking": {"en": "Book another time", "ru": "Записаться ещё раз", "cz": "Rezervovat další termín"},
  "booking.manageLink": {"en": "Manage this booking", "ru": "Управление записью", "cz": "Spravovat rezervaci"},
  "booking.manageHint": {"en": "Save this link: you can confirm, reschedule or cancel the visit there.", "ru": "Сохраните ссылку: по ней можно подтвердить, перенести или отменить визит.", "cz": "Uložte si odkaz: můžete tam návštěvu potvrdit, přeložit nebo zrušit."},
  "booking.depositTermsTitle": {"en": "Deposit to confirm", "ru": "Предоплата для подтверждения", "cz": "Záloha pro potvrzení"},
  "booking.depositFixed": {"en": "Fixed deposit", "ru": "Фиксированная предоплата", "cz": "Pevná záloha"},
  "booking.depositPercent": {"en": "{n}% of the price", "ru": "{n}% от стоимости", "cz": "{n} % z ceny"},
  "booking.depositAmount": {"en": "Deposit now", "ru": "Предоплата", "cz": "Záloha"},
  "booking.remainingAmount": {"en": "Remaining at the salon", "ru": "Остаток в салоне", "cz": "Zbytek v salonu"},
  "booking.holdMinutes": {"en": "The slot is held for {n} minutes.", "ru": "Время удерживается {n} мин.", "cz": "Termín držíme {n} min."},
  "booking.holdNote": {"en": "The booking is confirmed only when the payment provider confirms the deposit.", "ru": "Запись подтверждается только после подтверждения оплаты провайдером.", "cz": "Rezervace se potvrdí až po potvrzení platby poskytovatelem."},
  "booking.heldTitle": {"en": "Slot held — pay the deposit", "ru": "Время удержано — внесите предоплату", "cz": "Termín držíme — zaplaťte zálohu"},
  "booking.heldText": {"en": "We are holding this time for you. Pay the deposit to confirm the booking; the rest is paid at the salon.", "ru": "Мы держим это время за вами. Внесите предоплату для подтверждения записи, остаток оплатите в салоне.", "cz": "Tento čas pro vás držíme. Zaplaťte zálohu pro potvrzení rezervace, zbytek uhradíte v salonu."},
  "booking.payDeposit": {"en": "Pay deposit", "ru": "Оплатить предоплату", "cz": "Zaplatit zálohu"},
  "booking.payBefore": {"en": "Pay before", "ru": "Оплатить до", "cz": "Zaplatit do"},
  "payment.deposit": {"en": "Deposit", "ru": "Предоплата", "cz": "Záloha"},
  "payment.remaining": {"en": "Remaining", "ru": "Остаток", "cz": "Zbytek"},
  "payment.sandboxTitle": {"en": "Sandbox checkout", "ru": "Тестовая оплата", "cz": "Testovací platba"},
  "payment.sandboxBadge": {"en": "Test mode — no real money", "ru": "Тестовый режим — реальные деньги не списываются", "cz": "Testovací režim — skutečné peníze se neplatí"},
  "payment.sandboxText": {"en": "The local sandbox provider signs the result and sends it to the booking service. No card is charged.", "ru": "Локальный sandbox-провайдер подписывает результат и отправляет его сервису записи. Карта не используется.", "cz": "Místní sandbox poskytovatel podepíše výsledek a odešle ho rezervační službě. Karta se nepoužívá."},
  "payment.sandboxPay": {"en": "Pay {amount}", "ru": "Оплатить {amount}", "cz": "Zaplatit {amount}"},
  "payment.sandboxFail": {"en": "Simulate a failed payment", "ru": "Смоделировать неуспешную оплату", "cz": "Simulovat neúspěšnou platbu"},
  "payment.sandboxSending": {"en": "Sending the result…", "ru": "Отправляю результат…", "cz": "Odesílám výsledek…"},
  "payment.alreadySettled": {"en": "This payment is already settled. Check its status.", "ru": "Эта оплата уже завершена. Проверьте её статус.", "cz": "Tato platba je již dokončena. Zkontrolujte její stav."},
  "payment.checkStatus": {"en": "Check status", "ru": "Проверить статус", "cz": "Zkontrolovat stav"},
  "payment.invalidLink": {"en": "Payment link is not valid", "ru": "Ссылка на оплату недействительна", "cz": "Odkaz na platbu není platný"},
  "payment.invalidLinkText": {"en": "Open the link from the booking confirmation again.", "ru": "Откройте ссылку из подтверждения записи заново.", "cz": "Otevřete znovu odkaz z potvrzení rezervace."},
  "payment.returnTitle": {"en": "Payment status", "ru": "Статус оплаты", "cz": "Stav platby"},
  "payment.checking": {"en": "Checking the payment status…", "ru": "Проверяю статус оплаты…", "cz": "Kontroluji stav platby…"},
  "payment.waitingTitle": {"en": "Waiting for confirmation", "ru": "Ждём подтверждения", "cz": "Čekáme na potvrzení"},
  "payment.waitingText": {"en": "The provider has not confirmed the payment yet. This page checks the server and never trusts the return URL alone.", "ru": "Провайдер ещё не подтвердил оплату. Страница проверяет сервер и не доверяет одному лишь адресу возврата.", "cz": "Poskytovatel zatím platbu nepotvrdil. Stránka kontroluje server a nespoléhá jen na návratovou adresu."},
  "payment.waitingHint": {"en": "You can close this page and open the link later to check the status.", "ru": "Страницу можно закрыть и открыть ссылку позже, чтобы проверить статус.", "cz": "Stránku můžete zavřít a odkaz otevřít později pro kontrolu stavu."},
  "payment.checkAgain": {"en": "Check again", "ru": "Проверить снова", "cz": "Zkontrolovat znovu"},
  "payment.paidTitle": {"en": "Payment received", "ru": "Оплата получена", "cz": "Platba přijata"},
  "payment.paidText": {"en": "The deposit is paid and the booking is confirmed.", "ru": "Предоплата оплачена, запись подтверждена.", "cz": "Záloha je zaplacena a rezervace potvrzena."},
  "payment.failedTitle": {"en": "Payment was not completed", "ru": "Оплата не прошла", "cz": "Platba neproběhla"},
  "payment.failedText": {"en": "The slot has been released. You can book again or contact the salon.", "ru": "Время освобождено. Можно записаться снова или связаться с салоном.", "cz": "Termín byl uvolněn. Můžete rezervovat znovu nebo kontaktovat salon."},
  "payment.expiredTitle": {"en": "The hold has expired", "ru": "Удержание истекло", "cz": "Rezervace vypršela"},
  "payment.expiredText": {"en": "The slot was released because the deposit was not paid in time. You can book again.", "ru": "Время освобождено, потому что предоплата не поступила вовремя. Можно записаться снова.", "cz": "Termín byl uvolněn, protože záloha nepřišla včas. Můžete rezervovat znovu."},
  "payment.cancelledTitle": {"en": "Payment cancelled", "ru": "Оплата отменена", "cz": "Platba zrušena"},
  "payment.cancelledText": {"en": "The hold was released. You can book again.", "ru": "Удержание снято. Можно записаться снова.", "cz": "Držení termínu bylo zrušeno. Můžete rezervovat znovu."},
  "payment.reviewTitle": {"en": "Payment needs a manual check", "ru": "Оплата требует ручной проверки", "cz": "Platba vyžaduje ruční kontrolu"},
  "payment.reviewText": {"en": "The provider confirmed the payment after the hold changed. The salon will reconcile it with you.", "ru": "Провайдер подтвердил оплату после изменения удержания. Салон сверит платёж с вами.", "cz": "Poskytovatel potvrdil platbu po změně držení termínu. Salon ji s vámi vyrovná."},
  "payment.loadError": {"en": "Could not load the payment.", "ru": "Не удалось загрузить оплату.", "cz": "Platbu se nepodařilo načíst."},
  "payment.status.pending": {"en": "Pending", "ru": "Ожидает", "cz": "Čeká"},
  "payment.status.paid": {"en": "Paid", "ru": "Оплачено", "cz": "Zaplaceno"},
  "payment.status.failed": {"en": "Failed", "ru": "Не прошла", "cz": "Neúspěšná"},
  "payment.status.expired": {"en": "Expired", "ru": "Истекла", "cz": "Vypršela"},
  "payment.status.cancelled": {"en": "Cancelled", "ru": "Отменена", "cz": "Zrušena"},
  "payment.status.reconcile": {"en": "Needs review", "ru": "Нужна сверка", "cz": "Ke kontrole"},
  "payment.status.partially_refunded": {"en": "Partly refunded", "ru": "Частично возвращено", "cz": "Částečně vráceno"},
  "payment.status.refunded": {"en": "Refunded", "ru": "Возвращено", "cz": "Vráceno"},
  "finance.servicePayments.title": {"en": "Guest deposits", "ru": "Предоплаты гостей", "cz": "Zálohy hostů"},
  "finance.servicePayments.subtitle": {"en": "Prepayments from online bookings, separate from your Xtrix subscription.", "ru": "Оплаты онлайн-записей, отдельно от подписки Xtrix.", "cz": "Platby z online rezervací, odděleně od předplatného Xtrix."},
  "finance.servicePayments.empty": {"en": "No deposits yet.", "ru": "Предоплат пока нет.", "cz": "Zatím žádné zálohy."},
  "finance.servicePayments.loadError": {"en": "Could not load guest deposits.", "ru": "Не удалось загрузить предоплаты.", "cz": "Zálohy se nepodařilo načíst."},
  "finance.servicePayments.filter": {"en": "Status", "ru": "Статус", "cz": "Stav"},
  "finance.servicePayments.allStatuses": {"en": "All statuses", "ru": "Все статусы", "cz": "Všechny stavy"},
  "finance.servicePayments.client": {"en": "Client", "ru": "Клиент", "cz": "Klient"},
  "finance.servicePayments.service": {"en": "Service", "ru": "Услуга", "cz": "Služba"},
  "finance.servicePayments.visit": {"en": "Visit", "ru": "Визит", "cz": "Návštěva"},
  "finance.servicePayments.status": {"en": "Status", "ru": "Статус", "cz": "Stav"},
  "finance.servicePayments.amount": {"en": "Deposit", "ru": "Предоплата", "cz": "Záloha"},
  "finance.servicePayments.refunded": {"en": "Refunded", "ru": "Возвращено", "cz": "Vráceno"},
  "finance.servicePayments.refundable": {"en": "Refundable", "ru": "К возврату", "cz": "K vrácení"},
  "finance.servicePayments.holdExpires": {"en": "Hold expires", "ru": "Удержание до", "cz": "Držení do"},
  "finance.servicePayments.refund": {"en": "Refund", "ru": "Вернуть", "cz": "Vrátit"},
  "finance.servicePayments.refundTitle": {"en": "Refund deposit", "ru": "Возврат предоплаты", "cz": "Vrácení zálohy"},
  "finance.servicePayments.amountLabel": {"en": "Amount", "ru": "Сумма", "cz": "Částka"},
  "finance.servicePayments.amountHint": {"en": "Leave empty to refund the remaining amount.", "ru": "Оставьте пустым, чтобы вернуть остаток.", "cz": "Ponechte prázdné pro vrácení zbytku."},
  "finance.servicePayments.reason": {"en": "Reason", "ru": "Причина", "cz": "Důvod"},
  "finance.servicePayments.reasonPlaceholder": {"en": "For example, the guest cancelled", "ru": "Например, гость отменил запись", "cz": "Například host zrušil rezervaci"},
  "finance.servicePayments.submit": {"en": "Refund", "ru": "Вернуть", "cz": "Vrátit"},
  "finance.servicePayments.submitting": {"en": "Refunding…", "ru": "Возвращаю…", "cz": "Vracím…"},
  "finance.servicePayments.cancel": {"en": "Cancel", "ru": "Отмена", "cz": "Zrušit"},
  "finance.servicePayments.done": {"en": "Refund recorded.", "ru": "Возврат записан.", "cz": "Vrácení zaznamenáno."},
  "finance.servicePayments.error": {"en": "Could not refund the deposit.", "ru": "Не удалось вернуть предоплату.", "cz": "Zálohu se nepodařilo vrátit."},
  "finance.servicePayments.refundsTitle": {"en": "Refunds", "ru": "Возвраты", "cz": "Vrácení"},
  "business.publicBooking.depositTitle": {"en": "Deposit for online bookings", "ru": "Предоплата для онлайн-записи", "cz": "Záloha pro online rezervace"},
  "business.publicBooking.depositHint": {"en": "A guest pays part of the price to hold a slot. The rest is paid at the salon.", "ru": "Гость оплачивает часть стоимости, чтобы удержать время. Остаток — в салоне.", "cz": "Host zaplatí část ceny, aby mu termín zůstal. Zbytek zaplatí v salonu."},
  "business.publicBooking.depositType": {"en": "Deposit type", "ru": "Тип предоплаты", "cz": "Typ zálohy"},
  "business.publicBooking.depositNone": {"en": "No deposit", "ru": "Без предоплаты", "cz": "Bez zálohy"},
  "business.publicBooking.depositFixed": {"en": "Fixed amount", "ru": "Фиксированная сумма", "cz": "Pevná částka"},
  "business.publicBooking.depositPercentage": {"en": "Percentage of the price", "ru": "Процент от стоимости", "cz": "Procento z ceny"},
  "business.publicBooking.depositValue": {"en": "Amount", "ru": "Сумма", "cz": "Částka"},
  "business.publicBooking.depositHold": {"en": "Hold, minutes", "ru": "Удержание, минут", "cz": "Držení, minuty"},
  "business.publicBooking.depositSave": {"en": "Save deposit settings", "ru": "Сохранить настройки предоплаты", "cz": "Uložit nastavení zálohy"},
  "business.publicBooking.depositSaving": {"en": "Saving…", "ru": "Сохранение…", "cz": "Ukládám…"},
  "business.publicBooking.depositSaved": {"en": "Deposit settings saved.", "ru": "Настройки предоплаты сохранены.", "cz": "Nastavení zálohy uloženo."},
  "business.publicBooking.depositUnavailable": {"en": "The payment provider is not configured on this server, so guests do not see a deposit.", "ru": "Платёжный провайдер на этом сервере не настроен, поэтому гости не видят предоплату.", "cz": "Poskytovatel plateb není na tomto serveru nastaven, proto hosté zálohu nevidí."},
  "business.publicBooking.depositInvalid": {"en": "Check the deposit amount and hold time.", "ru": "Проверьте сумму предоплаты и время удержания.", "cz": "Zkontrolujte částku zálohy a dobu držení."},
  "portal.title": {"en": "Client area", "ru": "Кабинет клиента", "cz": "Klientský portál"},
  "portal.login.title": {"en": "Sign in to your client area", "ru": "Вход в кабинет клиента", "cz": "Přihlášení do klientského portálu"},
  "portal.login.subtitle": {"en": "See your visits, points and questionnaires. Sign-in is by a one-time link — no password needed.", "ru": "Смотрите свои визиты, баллы и анкеты. Вход по одноразовой ссылке — пароль не нужен.", "cz": "Prohlédněte si návštěvy, body a dotazníky. Přihlášení je jednorázovým odkazem — bez hesla."},
  "portal.login.salon": {"en": "Salon code", "ru": "Код салона", "cz": "Kód salonu"},
  "portal.login.salonHint": {"en": "It is in the address of the page the salon shared with you.", "ru": "Он есть в адресе страницы, которую прислал салон.", "cz": "Najdete ho v adrese stránky, kterou vám salon poslal."},
  "portal.login.email": {"en": "Email", "ru": "Email", "cz": "E-mail"},
  "portal.login.submit": {"en": "Email me a sign-in link", "ru": "Отправить ссылку для входа", "cz": "Poslat odkaz pro přihlášení"},
  "portal.login.sending": {"en": "Sending...", "ru": "Отправляю...", "cz": "Odesílám..."},
  "portal.login.sentTitle": {"en": "Check your email", "ru": "Проверьте почту", "cz": "Zkontrolujte e-mail"},
  "portal.login.sent": {"en": "If this email belongs to a client of the salon, a sign-in link has been sent. It is valid for 30 minutes and can be used once.", "ru": "Если этот email принадлежит клиенту салона, ссылка для входа отправлена. Она действует 30 минут и может быть использована один раз.", "cz": "Pokud tento e-mail patří klientovi salonu, odkaz pro přihlášení byl odeslán. Je platný 30 minut a lze jej použít jednou."},
  "portal.login.another": {"en": "Use another email", "ru": "Использовать другой email", "cz": "Použít jiný e-mail"},
  "portal.login.verifying": {"en": "Opening your client area...", "ru": "Открываю кабинет...", "cz": "Otevírám klientský portál..."},
  "portal.login.invalidLink": {"en": "This sign-in link is invalid, has expired, or has already been used. Request a new one.", "ru": "Ссылка для входа недействительна, истекла или уже использована. Запросите новую.", "cz": "Tento odkaz pro přihlášení je neplatný, vypršel nebo byl již použit. Vyžádejte si nový."},
  "portal.login.failed": {"en": "Couldn't send the sign-in link. Try again.", "ru": "Не удалось отправить ссылку для входа. Попробуйте ещё раз.", "cz": "Odkaz pro přihlášení se nepodařilo odeslat. Zkuste to znovu."},
  "portal.login.needSalon": {"en": "Open the personal link from the salon's email. To get a new one, enter the salon code and your email.", "ru": "Откройте личную ссылку из письма салона. Чтобы получить новую, укажите код салона и свой email.", "cz": "Otevřete osobní odkaz z e-mailu salonu. Pro nový odkaz zadejte kód salonu a svůj e-mail."},
  "portal.signedInAs": {"en": "Signed in as", "ru": "Вы вошли как", "cz": "Přihlášen jako"},
  "portal.logout": {"en": "Sign out", "ru": "Выйти", "cz": "Odhlásit se"},
  "portal.upcoming": {"en": "Upcoming visits", "ru": "Предстоящие визиты", "cz": "Nadcházející návštěvy"},
  "portal.past": {"en": "Past visits", "ru": "Прошлые визиты", "cz": "Proběhlé návštěvy"},
  "portal.noUpcoming": {"en": "No upcoming visits.", "ru": "Предстоящих визитов нет.", "cz": "Žádné nadcházející návštěvy."},
  "portal.noPast": {"en": "No past visits yet.", "ru": "Прошлых визитов пока нет.", "cz": "Zatím žádné proběhlé návštěvy."},
  "portal.manage": {"en": "Manage booking", "ru": "Управление записью", "cz": "Spravovat rezervaci"},
  "portal.openingManage": {"en": "Opening...", "ru": "Открываю...", "cz": "Otevírám..."},
  "portal.manageError": {"en": "Couldn't open booking management. Try again.", "ru": "Не удалось открыть управление записью. Попробуйте ещё раз.", "cz": "Správu rezervace se nepodařilo otevřít. Zkuste to znovu."},
  "portal.manageHint": {"en": "Rescheduling and cancellation follow the salon's booking rules.", "ru": "Перенос и отмена выполняются по правилам салона.", "cz": "Přeložení a zrušení se řídí pravidly salonu."},
  "portal.bookAgain": {"en": "Book again", "ru": "Записаться снова", "cz": "Rezervovat znovu"},
  "portal.bookingDisabled": {"en": "Online booking is currently off. Contact the salon to book again.", "ru": "Онлайн-запись сейчас выключена. Свяжитесь с салоном, чтобы записаться снова.", "cz": "Online rezervace je momentálně vypnutá. Pro novou rezervaci kontaktujte salon."},
  "portal.loyalty.title": {"en": "Loyalty", "ru": "Лояльность", "cz": "Věrnostní program"},
  "portal.loyalty.points": {"en": "Points", "ru": "Баллы", "cz": "Body"},
  "portal.loyalty.cashback": {"en": "Cashback", "ru": "Кэшбэк", "cz": "Cashback"},
  "portal.loyalty.level": {"en": "Level", "ru": "Уровень", "cz": "Úroveň"},
  "portal.loyalty.benefits": {"en": "Benefits", "ru": "Привилегии", "cz": "Výhody"},
  "portal.loyalty.empty": {"en": "The salon hasn't added loyalty points yet.", "ru": "Салон пока не начислил баллы.", "cz": "Salon zatím nepřidal věrnostní body."},
  "portal.forms.title": {"en": "My questionnaires", "ru": "Мои анкеты", "cz": "Moje dotazníky"},
  "portal.forms.empty": {"en": "No submitted questionnaires.", "ru": "Заполненных анкет нет.", "cz": "Žádné vyplněné dotazníky."},
  "portal.forms.version": {"en": "Version", "ru": "Версия", "cz": "Verze"},
  "portal.forms.answers": {"en": "Answers", "ru": "Ответы", "cz": "Odpovědi"},
  "portal.forms.noAnswers": {"en": "No answers", "ru": "Нет ответов", "cz": "Žádné odpovědi"},
  "portal.sessionExpiredTitle": {"en": "Session ended", "ru": "Сессия завершена", "cz": "Relace skončila"},
  "portal.sessionExpiredText": {"en": "The client session is invalid or has expired. Request a new sign-in link.", "ru": "Клиентская сессия недействительна или истекла. Запросите новую ссылку для входа.", "cz": "Klientská relace je neplatná nebo vypršela. Vyžádejte si nový odkaz pro přihlášení."},
  "portal.goToLogin": {"en": "Go to sign-in", "ru": "Перейти ко входу", "cz": "Přejít k přihlášení"},
  "portal.loadError": {"en": "Couldn't load your client area.", "ru": "Не удалось загрузить кабинет.", "cz": "Klientský portál se nepodařilo načíst."},
  "portal.visitNumber": {"en": "Visit", "ru": "Визит", "cz": "Návštěva"},
  "legacy.title": {"en": "Visit history", "ru": "История визитов", "cz": "Historie návštěv"},
  "legacy.subtitle": {"en": "Enter the PIN from the salon to see the visits linked to this QR code.", "ru": "Введите PIN от салона, чтобы увидеть визиты, привязанные к этому QR-коду.", "cz": "Zadejte PIN od salonu pro zobrazení návštěv spojených s tímto QR kódem."},
  "legacy.pin": {"en": "PIN", "ru": "PIN", "cz": "PIN"},
  "legacy.show": {"en": "Show history", "ru": "Показать историю", "cz": "Zobrazit historii"},
  "legacy.showing": {"en": "Checking...", "ru": "Проверяю...", "cz": "Ověřuji..."},
  "legacy.invalid": {"en": "The QR code or PIN is invalid. Check the PIN and try again.", "ru": "QR-код или PIN неверный. Проверьте PIN и попробуйте ещё раз.", "cz": "QR kód nebo PIN je neplatný. Zkontrolujte PIN a zkuste to znovu."},
  "legacy.locked": {"en": "Too many attempts. Try again later or ask the salon.", "ru": "Слишком много попыток. Попробуйте позже или обратитесь в салон.", "cz": "Příliš mnoho pokusů. Zkuste to později nebo kontaktujte salon."},
  "legacy.missingCode": {"en": "This page needs a QR code from the salon.", "ru": "Для этой страницы нужен QR-код от салона.", "cz": "Tato stránka vyžaduje QR kód od salonu."},
  "legacy.client": {"en": "Client", "ru": "Клиент", "cz": "Klient"},
  "legacy.visits": {"en": "Visits", "ru": "Визиты", "cz": "Návštěvy"},
  "legacy.noVisits": {"en": "No visits yet.", "ru": "Визитов пока нет.", "cz": "Zatím žádné návštěvy."},
  "legacy.back": {"en": "Client area", "ru": "Кабинет клиента", "cz": "Klientský portál"},
  "legacy.qr": {"en": "QR code", "ru": "QR-код", "cz": "QR kód"},
  "legacy.qrHint": {"en": "It is filled in from the link. You can paste it manually if needed.", "ru": "Подставляется из ссылки. При необходимости вставьте вручную.", "cz": "Vyplní se z odkazu. V případě potřeby jej vložte ručně."},
  "validation.code.invalid_assistant_name": {"en": "No line breaks or special characters", "ru": "Без переносов строк и спецсимволов", "cz": "Bez zalomení řádků a speciálních znaků"},
  "field.assistant_name": {"en": "Assistant name", "ru": "Имя помощника", "cz": "Jméno asistenta"},
  "field.assistant_gender": {"en": "Assistant gender", "ru": "Род помощника", "cz": "Rod asistenta"},
  "serviceForm.name": {"en": "Service Name", "ru": "Название услуги", "cz": "Název služby"},
  "serviceForm.duration": {"en": "Duration (minutes)", "ru": "Длительность (минуты)", "cz": "Délka (minuty)"},
  "serviceForm.primary": {"en": "Primary Specialist", "ru": "Основной специалист", "cz": "Hlavní specialista"},
  "serviceForm.loading": {"en": "Loading specialists...", "ru": "Загрузка специалистов...", "cz": "Načítání specialistů..."},
  "serviceForm.additional": {"en": "Additional Specialists (Optional)", "ru": "Дополнительные специалисты (необязательно)", "cz": "Další specialisté (nepovinné)"},
  "serviceForm.hint": {"en": "Select all specialists who can provide this service", "ru": "Выберите всех специалистов, которые оказывают эту услугу", "cz": "Vyberte všechny specialisty, kteří poskytují tuto službu"},
  "serviceForm.primaryBadge": {"en": "(Primary)", "ru": "(Основной)", "cz": "(Hlavní)"},
  "serviceForm.placeholder": {"en": "e.g., Facial Treatment", "ru": "Например, уход за лицом", "cz": "Např. ošetření pleti"},
  "serviceForm.create": {"en": "Create Service", "ru": "Создать услугу", "cz": "Vytvořit službu"},
  "serviceForm.update": {"en": "Update Service", "ru": "Сохранить услугу", "cz": "Uložit službu"},
  "serviceForm.saveError": {"en": "Failed to save service", "ru": "Не удалось сохранить услугу", "cz": "Službu se nepodařilo uložit"},
  "register.contactRequired": {"en": "At least one of Email or Phone is required", "ru": "Укажите email или телефон — достаточно одного из двух", "cz": "Zadejte e-mail nebo telefon — stačí jeden z údajů"},
  "register.namePlaceholder": {"en": "John Doe", "ru": "Иван Иванов", "cz": "Jan Novák"},
  "employeeForm.passwordInfo": {"en": "A password will be automatically generated and shown after creation", "ru": "Пароль будет создан автоматически и показан после создания сотрудника", "cz": "Heslo se automaticky vygeneruje a zobrazí po vytvoření zaměstnance"},
  "employeeForm.created": {"en": "Employee Created Successfully!", "ru": "Сотрудник создан!", "cz": "Zaměstnanec byl úspěšně vytvořen!"},
  "employeeForm.password": {"en": "Generated Password:", "ru": "Сгенерированный пароль:", "cz": "Vygenerované heslo:"},
  "employeeForm.passwordHint": {"en": "Please save this password and provide it to the employee. They can log in using their email or phone number.", "ru": "Сохраните пароль и передайте сотруднику. Для входа он может использовать email или телефон.", "cz": "Uložte si heslo a předejte ho zaměstnanci. Přihlásit se může pomocí e-mailu nebo telefonu."},
  "employeeForm.copy": {"en": "Copy", "ru": "Копировать", "cz": "Kopírovat"},
  "employeeForm.copied": {"en": "✓ Copied!", "ru": "✓ Скопировано!", "cz": "✓ Zkopírováno!"},
  "register.passwordHint": {"en": "Minimum 8 characters, include uppercase, lowercase, number, and special character", "ru": "Минимум 8 символов: заглавная и строчная буквы, цифра и специальный символ", "cz": "Alespoň 8 znaků, včetně velkého a malého písmene, číslice a speciálního znaku"},
  "register.passwordMismatch": {"en": "Passwords do not match", "ru": "Пароли не совпадают", "cz": "Hesla se neshodují"},
  "register.failed": {"en": "Registration failed", "ru": "Не удалось зарегистрироваться", "cz": "Registrace se nezdařila"},
  "register.creating": {"en": "Creating account...", "ru": "Создание аккаунта...", "cz": "Vytváření účtu..."},
  "import.row": {"en": "Row", "ru": "Строка", "cz": "Řádek"},
  "import.moreErrors": {"en": "more errors", "ru": "ещё ошибок", "cz": "dalších chyb"},
  "import.moreRows": {"en": "more rows", "ru": "ещё строк", "cz": "dalších řádků"},
  "visits.saveError": {"en": "Failed to save visit", "ru": "Не удалось сохранить визит", "cz": "Návštěvu se nepodařilo uložit"},
  "visits.loyaltyError": {"en": "Failed to use loyalty points", "ru": "Не удалось списать бонусные баллы", "cz": "Věrnostní body se nepodařilo uplatnit"},
  "dashboard.remaining": {"en": "Remaining", "ru": "Остальные", "cz": "Ostatní"},
  "dashboard.today": {"en": "Today", "ru": "Сегодня", "cz": "Dnes"},
  "dashboard.versus": {"en": "vs", "ru": "и", "cz": "a"},
  "inventory.businessRequired": {"en": "Create your business first, the stock belongs to it.", "ru": "Сначала создайте бизнес, склад привязан к нему.", "cz": "Nejprve vytvořte firmu, sklad k ní patří."},
  "finance.businessRequired": {"en": "Create your business first, expenses belong to it.", "ru": "Сначала создайте бизнес, расходы привязаны к нему.", "cz": "Nejprve vytvořte firmu, výdaje k ní patří."},
  "inventory.createError": {"en": "Failed to create product. Please try again.", "ru": "Не удалось создать товар. Попробуйте ещё раз.", "cz": "Produkt se nepodařilo vytvořit. Zkuste to znovu."},

  'common.save': { en: 'Save', ru: 'Сохранить', cz: 'Uložit' },
  'common.cancel': { en: 'Cancel', ru: 'Отмена', cz: 'Zrušit' },
  'common.delete': { en: 'Delete', ru: 'Удалить', cz: 'Smazat' },
  'common.edit': { en: 'Edit', ru: 'Редактировать', cz: 'Upravit' },
  'common.create': { en: 'Create', ru: 'Создать', cz: 'Vytvořit' },
  'common.search': { en: 'Search', ru: 'Поиск', cz: 'Hledat' },
  'common.filter': { en: 'Filter', ru: 'Фильтр', cz: 'Filtr' },
  'common.loading': { en: 'Loading...', ru: 'Загрузка...', cz: 'Načítání...' },
  'common.error': { en: 'Error', ru: 'Ошибка', cz: 'Chyba' },
  'common.success': { en: 'Success', ru: 'Успешно', cz: 'Úspěch' },
  'common.export': { en: 'Export', ru: 'Экспорт', cz: 'Export' },
  'common.noData': { en: 'No data available', ru: 'Нет данных', cz: 'Žádná data' },
  'common.print': { en: 'Print', ru: 'Печать', cz: 'Tisk' },
  'common.saving': { en: 'Saving...', ru: 'Сохранение...', cz: 'Ukládání...' },
  'common.view': { en: 'View', ru: 'Просмотр', cz: 'Zobrazit' },
  
  'export.title': { en: 'Export Data', ru: 'Экспорт данных', cz: 'Export dat' },
  'export.format': { en: 'Format', ru: 'Формат', cz: 'Formát' },
  'export.reportType': { en: 'Report Type', ru: 'Тип отчета', cz: 'Typ reportu' },
  'export.export': { en: 'Export', ru: 'Экспортировать', cz: 'Exportovat' },
  'export.print': { en: 'Print', ru: 'Печать', cz: 'Tisk' },
  'export.exporting': { en: 'Exporting...', ru: 'Экспортирование...', cz: 'Exportování...' },
  'export.error': { en: 'Error during export. Please try again.', ru: 'Ошибка при экспорте. Попробуйте снова.', cz: 'Chyba při exportu. Zkuste to znovu.' },
  'export.includeCharts': { en: 'Include charts/graphs', ru: 'Включить графики', cz: 'Zahrnout grafy' },
  'export.itemsCount': { en: 'Items to export', ru: 'Элементов для экспорта', cz: 'Položek k exportu' },
  'export.items': { en: 'items', ru: 'элементов', cz: 'položek' },
  'export.clientReport': { en: 'Client Report', ru: 'Отчет по клиенту', cz: 'Report klienta' },
  'export.clientProfile': { en: 'Profile & Contacts', ru: 'Профиль и контакты', cz: 'Profil a kontakty' },
  'export.clientContacts': { en: 'Contacts', ru: 'Контакты', cz: 'Kontakty' },
  'export.clientVisits': { en: 'Visit History', ru: 'История визитов', cz: 'Historie návštěv' },
  'export.clientFinance': { en: 'Client Finances', ru: 'Финансы клиента', cz: 'Finance klienta' },
  'export.visitsReport': { en: 'Visits Report', ru: 'Отчет по визитам', cz: 'Report návštěv' },
  'export.servicesReport': { en: 'Services Report', ru: 'Отчет по услугам', cz: 'Report služeb' },
  'export.financeReport': { en: 'Financial Report', ru: 'Финансовый отчет', cz: 'Finanční report' },
  'export.payments': { en: 'Payments', ru: 'Платежи', cz: 'Platby' },
  'export.revenue': { en: 'Revenue', ru: 'Выручка', cz: 'Příjmy' },
  'export.periods': { en: 'Periods', ru: 'Периоды', cz: 'Období' },
  'export.employeesReport': { en: 'Employees Report', ru: 'Отчет по сотрудникам', cz: 'Report zaměstnanců' },
  'export.employeeVisits': { en: 'Employee Visits', ru: 'Визиты сотрудника', cz: 'Návštěvy zaměstnance' },
  'export.employeeServices': { en: 'Employee Services', ru: 'Услуги сотрудника', cz: 'Služby zaměstnance' },
  'export.employeeSalary': { en: 'Employee Salary', ru: 'Зарплата сотрудника', cz: 'Plat zaměstnance' },
  'export.analyticsReport': { en: 'Analytics Report', ru: 'Аналитический отчет', cz: 'Analytický report' },
  'export.attendance': { en: 'Attendance', ru: 'Посещаемость', cz: 'Návštěvnost' },
  'export.topMetrics': { en: 'Top Metrics', ru: 'Топ-показатели', cz: 'Nejlepší metriky' },
  'export.inventoryReport': { en: 'Inventory Report', ru: 'Отчет по складу', cz: 'Report skladu' },
  'export.stockRemaining': { en: 'Stock Remaining', ru: 'Остатки товаров', cz: 'Zbývající zásoby' },
  'export.movements': { en: 'Movements', ru: 'Движения', cz: 'Pohyby' },
  'export.writeoffs': { en: 'Writeoffs', ru: 'Списания', cz: 'Odpisy' },
  'export.expensesReport': { en: 'Expenses Report', ru: 'Отчет по расходам', cz: 'Report výdajů' },
  'export.expenseItems': { en: 'Expense Items', ru: 'Статьи расходов', cz: 'Položky výdajů' },
  'export.amounts': { en: 'Amounts', ru: 'Суммы', cz: 'Částky' },
  'export.selectPeriod': { en: 'Select Period', ru: 'Выберите период', cz: 'Vyberte období' },
  'export.selectReportType': { en: 'Select Report Type', ru: 'Выберите тип отчета', cz: 'Vyberte typ reportu' },
  'export.period': { en: 'Period', ru: 'Период', cz: 'Období' },
  'export.fromDate': { en: 'From Date', ru: 'С даты', cz: 'Od data' },
  'export.toDate': { en: 'To Date', ru: 'По дату', cz: 'Do data' },
  'export.personalReport': { en: 'Personal Report', ru: 'Персональный отчет', cz: 'Osobní report' },
  'export.selectData': { en: 'Select Data', ru: 'Выберите данные', cz: 'Vyberte data' },
  'export.allData': { en: 'All Data', ru: 'Все данные', cz: 'Všechna data' },
  'export.filteredData': { en: 'Filtered Data', ru: 'Отфильтрованные данные', cz: 'Filtrovaná data' },
  'export.selectedRows': { en: 'Selected Rows', ru: 'Выбранные строки', cz: 'Vybrané řádky' },
  
  'import.title': { en: 'Import Clients from Excel', ru: 'Импорт клиентов из Excel', cz: 'Import klientů z Excelu' },
  'import.selectFile': { en: 'Select Excel file (.xlsx, .xls)', ru: 'Выберите Excel файл (.xlsx, .xls)', cz: 'Vyberte Excel soubor (.xlsx, .xls)' },
  'import.fileFormat': { en: 'File must contain columns: Name (required), Phone, Email', ru: 'Файл должен содержать колонки: Имя (обязательно), Телефон, Email', cz: 'Soubor musí obsahovat sloupce: Jméno (povinné), Telefon, Email' },
  'import.preview': { en: 'Preview', ru: 'Предварительный просмотр', cz: 'Náhled' },
  'import.selectOtherFile': { en: 'Select another file', ru: 'Выбрать другой файл', cz: 'Vybrat jiný soubor' },
  'import.totalRows': { en: 'Total rows', ru: 'Всего строк', cz: 'Celkem řádků' },
  'import.validRows': { en: 'Valid rows', ru: 'Корректных', cz: 'Platné' },
  'import.errors': { en: 'Errors', ru: 'Ошибок', cz: 'Chyby' },
  'import.validationErrors': { en: 'Validation errors:', ru: 'Ошибки валидации:', cz: 'Chyby validace:' },
  'import.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'import.error': { en: 'Error', ru: 'Ошибка', cz: 'Chyba' },
  'import.ready': { en: 'Ready', ru: 'Готов', cz: 'Připraveno' },
  'import.result': { en: 'Import result:', ru: 'Результат импорта:', cz: 'Výsledek importu:' },
  'import.successCount': { en: 'Successfully added', ru: 'Успешно добавлено', cz: 'Úspěšně přidáno' },
  'import.skippedCount': { en: 'Skipped', ru: 'Пропущено', cz: 'Přeskočeno' },
  'import.import': { en: 'Import', ru: 'Импортировать', cz: 'Importovat' },
  'import.importing': { en: 'Importing...', ru: 'Импорт...', cz: 'Importování...' },
  'import.nameRequired': { en: 'Name is required', ru: 'Имя обязательно', cz: 'Jméno je povinné' },
  'import.invalidEmail': { en: 'Invalid email format', ru: 'Неверный формат email', cz: 'Neplatný formát emailu' },
  'import.invalidPhone': { en: 'Invalid phone format', ru: 'Неверный формат телефона', cz: 'Neplatný formát telefonu' },
  'import.duplicateInFile': { en: 'Duplicate in file', ru: 'Дубликат в файле', cz: 'Duplicitní v souboru' },
  'import.duplicateExists': { en: 'Client with this phone/email already exists', ru: 'Клиент с таким телефоном/email уже существует', cz: 'Klient s tímto telefonem/emailem již existuje' },
  'import.emptyFile': { en: 'File is empty', ru: 'Файл пустой', cz: 'Soubor je prázdný' },
  'import.nameColumnNotFound': { en: 'Name column not found', ru: 'Колонка с именем не найдена', cz: 'Sloupec s názvem nenalezen' },
  'import.parseError': { en: 'Error reading file', ru: 'Ошибка при чтении файла', cz: 'Chyba při čtení souboru' },
  'import.importWithErrors': { en: 'There are validation errors. Continue with import?', ru: 'Есть ошибки валидации. Продолжить импорт?', cz: 'Existují chyby validace. Pokračovat s importem?' },
  'import.importError': { en: 'Import error', ru: 'Ошибка импорта', cz: 'Chyba importu' },
  
  'specialistType.massage': { en: 'Massage Therapist', ru: 'Массажист', cz: 'Masér' },
  'specialistType.cosmetologist': { en: 'Cosmetologist', ru: 'Косметолог', cz: 'Kosmetička' },
  'specialistType.barber': { en: 'Barber', ru: 'Барбер', cz: 'Holič' },
  'specialistType.hairdresser': { en: 'Hairdresser', ru: 'Парикмахер', cz: 'Kadeřník' },
  'specialistType.esthetician': { en: 'Esthetician', ru: 'Эстетист', cz: 'Estetička' },
  'specialistType.nailTechnician': { en: 'Nail Technician', ru: 'Мастер маникюра/педикюра', cz: 'Manikérka' },
  'specialistType.lashTechnician': { en: 'Lash & Brow Technician', ru: 'Мастер по ресницам и бровям', cz: 'Technička řas a obočí' },
  'specialistType.makeupArtist': { en: 'Makeup Artist', ru: 'Визажист', cz: 'Vizážistka' },
  
  'specialistType.physiotherapist': { en: 'Physiotherapist', ru: 'Физиотерапевт', cz: 'Fyzioterapeut' },
  'specialistType.nutritionist': { en: 'Nutritionist', ru: 'Нутрициолог', cz: 'Výživový poradce' },
  'specialistType.aromatherapist': { en: 'Aromatherapist', ru: 'Ароматерапевт', cz: 'Aromaterapeut' },
  'specialistType.fitnessCoach': { en: 'Fitness Coach', ru: 'Фитнес-тренер', cz: 'Fitness trenér' },
  'specialistType.yogaInstructor': { en: 'Yoga Instructor', ru: 'Инструктор йоги', cz: 'Instruktor jógy' },
  'specialistType.psychologist': { en: 'Psychologist', ru: 'Психолог', cz: 'Psycholog' },
  'specialistType.psychotherapist': { en: 'Psychotherapist', ru: 'Психотерапевт', cz: 'Psychoterapeut' },
  
  'specialistType.therapist': { en: 'Therapist', ru: 'Терапевт', cz: 'Terapeut' },
  'specialistType.dentist': { en: 'Dentist', ru: 'Стоматолог', cz: 'Zubař' },
  'specialistType.dermatologist': { en: 'Dermatologist', ru: 'Дерматолог', cz: 'Dermatolog' },
  'specialistType.doctor': { en: 'Doctor', ru: 'Врач-специалист', cz: 'Lékař' },
  'specialistType.cardiologist': { en: 'Cardiologist', ru: 'Кардиолог', cz: 'Kardiolog' },
  'specialistType.neurologist': { en: 'Neurologist', ru: 'Невролог', cz: 'Neurolog' },
  'specialistType.orthopedist': { en: 'Orthopedist', ru: 'Ортопед', cz: 'Ortoped' },
  'specialistType.gynecologist': { en: 'Gynecologist', ru: 'Гинеколог', cz: 'Gynekolog' },
  'specialistType.urologist': { en: 'Urologist', ru: 'Уролог', cz: 'Urolog' },
  'specialistType.ophthalmologist': { en: 'Ophthalmologist', ru: 'Офтальмолог', cz: 'Oftalmolog' },
  'specialistType.endocrinologist': { en: 'Endocrinologist', ru: 'Эндокринолог', cz: 'Endokrinolog' },
  'specialistType.pediatrician': { en: 'Pediatrician', ru: 'Педиатр', cz: 'Pediatr' },
  'specialistType.surgeon': { en: 'Surgeon', ru: 'Хирург', cz: 'Chirurg' },
  'specialistType.oncologist': { en: 'Oncologist', ru: 'Онколог', cz: 'Onkolog' },
  
  'category.beauty': { en: 'Beauty', ru: 'Красота', cz: 'Krása' },
  'category.wellness': { en: 'Wellness', ru: 'Велнес', cz: 'Wellness' },
  'category.healthcare': { en: 'Healthcare', ru: 'Здравоохранение', cz: 'Zdravotní péče' },
  
  'businessType.individual': { en: 'Individual Specialist', ru: 'Индивидуальный специалист', cz: 'Individuální specialista' },
  'businessType.salon': { en: 'Beauty Salon', ru: 'Салон красоты', cz: 'Kosmetický salón' },
  'businessType.clinic': { en: 'Clinic', ru: 'Клиника', cz: 'Klinika' },
  'businessType.medical': { en: 'Medical Center', ru: 'Медицинский центр', cz: 'Zdravotní středisko' },
  'businessType.dental': { en: 'Dental Clinic', ru: 'Стоматология', cz: 'Zubní ordinace' },
  'businessType.hospital': { en: 'Hospital', ru: 'Больница', cz: 'Nemocnice' },
  'businessType.barbershop': { en: 'Barbershop', ru: 'Барбершоп', cz: 'Holičství' },
  'businessType.rehabCenter': { en: 'Rehabilitation Center', ru: 'Реабилитационный центр', cz: 'Rehabilitační centrum' },
  
  'register.title': { en: 'Create your account', ru: 'Создайте свой аккаунт', cz: 'Vytvořte si účet' },
  'register.trial_badge': { en: '7 days CRM trial · No credit card required', ru: '7 дней CRM без карты · Без скрытых списаний', cz: '7 dní CRM zdarma · Bez platební karty' },
  'register.trial_desc': {"en": "Try CRM with up to 300 visits and AI for 7 days. No payment card is required.", "ru": "Попробуйте CRM с лимитом 300 визитов и ИИ на 7 дней. Банковская карта не нужна.", "cz": "Vyzkoušejte CRM s limitem 300 návštěv a AI na 7 dní. Platební karta není potřeba."},
  'register.ai_bonus': {"en": "AI is included for 7 days: 50 requests per day.", "ru": "ИИ включён на 7 дней: 50 запросов в день.", "cz": "AI je zahrnuta na 7 dní: 50 požadavků denně."},
  'register.fullName': { en: 'Full Name', ru: 'Полное имя', cz: 'Celé jméno' },
  'register.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  'register.phone': { en: 'Phone', ru: 'Телефон', cz: 'Telefon' },
  'register.password': { en: 'Password', ru: 'Пароль', cz: 'Heslo' },
  'register.confirmPassword': { en: 'Confirm Password', ru: 'Подтвердите пароль', cz: 'Potvrďte heslo' },
  'register.role': { en: 'Role', ru: 'Роль', cz: 'Role' },
  'role.admin': { en: 'Administrator', ru: 'Администратор', cz: 'Správce' },
  'role.businessOwner': { en: 'Business owner', ru: 'Владелец бизнеса', cz: 'Majitel podniku' },
  'role.specialist': { en: 'Specialist', ru: 'Специалист', cz: 'Specialista' },
  'role.employee': { en: 'Employee', ru: 'Сотрудник', cz: 'Zaměstnanec' },
  'role.client': { en: 'Client', ru: 'Клиент', cz: 'Klient' },
  'register.specialistType': { en: 'Specialist Type', ru: 'Тип специалиста', cz: 'Typ specialisty' },
  'register.selectSpecialistType': { en: 'Select specialist type', ru: 'Выберите тип специалиста', cz: 'Vyberte typ specialisty' },
  'register.createAccount': { en: 'Create Account', ru: 'Создать аккаунт', cz: 'Vytvořit účet' },
  'register.alreadyHaveAccount': { en: 'Already have an account?', ru: 'Уже есть аккаунт?', cz: 'Již máte účet?' },
  'register.signIn': { en: 'Sign in', ru: 'Войти', cz: 'Přihlásit se' },
  'register.accountCreatedSignIn': { en: 'Your account has been created. Please sign in.', ru: 'Аккаунт создан. Войдите в систему.', cz: 'Účet byl vytvořen. Přihlaste se prosím.' },
  'register.specialistTypeRequired': { en: 'Please select your specialist type', ru: 'Пожалуйста, выберите тип специалиста', cz: 'Vyberte prosím typ specialisty' },
  
  'clientForm.allergies': { en: 'Allergies', ru: 'Аллергии', cz: 'Alergie' },
  'clientForm.chronicDiseases': { en: 'Chronic Diseases', ru: 'Хронические заболевания', cz: 'Chronická onemocnění' },
  'clientForm.messageLanguage': { en: 'Language of messages to the client', ru: 'Язык сообщений клиенту', cz: 'Jazyk zpráv klientovi' },
  'clientForm.messageLanguageHint': { en: 'Reminders and greetings go out in this language. It doesn\'t depend on your interface language.', ru: 'На этом языке клиенту уходят напоминания и поздравления. От языка интерфейса не зависит.', cz: 'V tomto jazyce chodí klientovi připomínky a přání. Na jazyku rozhraní nezávisí.' },
  'clientForm.healthcareRequired': { en: 'Required for Healthcare Specialists', ru: 'Обязательно для медицинских специалистов', cz: 'Povinné pro zdravotnické specialisty' },
  'clientForm.healthcareRequiredDescription': { en: 'For healthcare specialists, allergies and chronic diseases are required fields.', ru: 'Для медицинских специалистов поля аллергии и хронических заболеваний являются обязательными.', cz: 'Pro zdravotnické specialisty jsou pole alergie a chronická onemocnění povinná.' },
  
  'specialistProfile.title': { en: 'My Specialist Profile', ru: 'Мой профиль специалиста', cz: 'Můj profil specialisty' },
  'specialistProfile.notFound': { en: 'Specialist profile not found. Please create your profile.', ru: 'Профиль специалиста не найден. Пожалуйста, создайте профиль.', cz: 'Profil specialisty nebyl nalezen. Vytvořte prosím profil.' },
  'specialistProfile.verificationPending': { en: 'Your profile is pending verification.', ru: 'Ваш профиль ожидает верификации.', cz: 'Váš profil čeká na ověření.' },
  'specialistProfile.verified': { en: 'Your profile is verified.', ru: 'Ваш профиль верифицирован.', cz: 'Váš profil je ověřen.' },
  'specialistProfile.basicInfo': { en: 'Basic Information', ru: 'Основная информация', cz: 'Základní informace' },
  'specialistProfile.specialistType': { en: 'Specialist Type', ru: 'Тип специалиста', cz: 'Typ specialisty' },
  'specialistProfile.category': { en: 'Category', ru: 'Категория', cz: 'Kategorie' },
  'specialistProfile.specialization': { en: 'Specialization', ru: 'Специализация', cz: 'Specializace' },
  'specialistProfile.specializationPlaceholder': { en: 'Describe your specialization...', ru: 'Опишите вашу специализацию...', cz: 'Popište svou specializaci...' },
  'specialistProfile.experience': { en: 'Experience', ru: 'Опыт работы', cz: 'Zkušenosti' },
  'specialistProfile.experienceYears': { en: 'Years of Experience', ru: 'Лет опыта', cz: 'Let zkušeností' },
  'specialistProfile.years': { en: 'years', ru: 'лет', cz: 'let' },
  'specialistProfile.education': { en: 'Education', ru: 'Образование', cz: 'Vzdělání' },
  'specialistProfile.educationPlaceholder': { en: 'Your education background...', ru: 'Ваше образование...', cz: 'Vaše vzdělání...' },
  'specialistProfile.certifications': { en: 'Certifications', ru: 'Сертификаты', cz: 'Certifikáty' },
  'specialistProfile.certificationsPlaceholder': { en: 'Your certifications and licenses...', ru: 'Ваши сертификаты и лицензии...', cz: 'Vaše certifikáty a licence...' },
  'specialistProfile.businessInfo': { en: 'Business Information', ru: 'Информация о бизнесе', cz: 'Obchodní informace' },
  'specialistProfile.businessName': { en: 'Business Name', ru: 'Название бизнеса', cz: 'Název podniku' },
  'specialistProfile.businessType': { en: 'Business Type', ru: 'Тип бизнеса', cz: 'Typ podniku' },
  'specialistProfile.address': { en: 'Address', ru: 'Адрес', cz: 'Adresa' },
  'specialistProfile.additionalInfo': { en: 'Additional Information', ru: 'Дополнительная информация', cz: 'Další informace' },
  'specialistProfile.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'specialistProfile.descriptionPlaceholder': { en: 'Public description...', ru: 'Публичное описание...', cz: 'Veřejný popis...' },
  'specialistProfile.languages': { en: 'Languages', ru: 'Языки', cz: 'Jazyky' },
  'specialistProfile.languagesPlaceholder': { en: 'e.g., English, Russian, Czech', ru: 'например, Английский, Русский, Чешский', cz: 'např. Angličtina, Ruština, Čeština' },
  
  'nav.dashboard': { en: 'Today', ru: 'Сегодня', cz: 'Dnes' },
  'nav.clients': { en: 'Clients', ru: 'Клиенты', cz: 'Klienti' },
  'nav.visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'nav.calendar': { en: 'Calendar', ru: 'Календарь', cz: 'Kalendář' },
  'nav.services': { en: 'Services', ru: 'Услуги', cz: 'Služby' },
  'nav.waitlist': { en: 'Waitlist', ru: 'Лист ожидания', cz: 'Seznam čekatelů' },
  'nav.profile': { en: 'Profile', ru: 'Профиль', cz: 'Profil' },
  'nav.logout': { en: 'Logout', ru: 'Выйти', cz: 'Odhlásit se' },
  
  'login.title': { en: 'Sign in to your account', ru: 'Войдите в свой аккаунт', cz: 'Přihlaste se ke svému účtu' },
  'login.subtitle': { en: 'Sign in to your account', ru: 'Войдите в свой аккаунт', cz: 'Přihlaste se ke svému účtu' },
  'login.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  'login.password': { en: 'Password', ru: 'Пароль', cz: 'Heslo' },
  'login.signIn': { en: 'Sign in', ru: 'Войти', cz: 'Přihlásit se' },
  'login.loggingIn': { en: 'Logging in...', ru: 'Вход...', cz: 'Přihlašování...' },
  'login.dontHaveAccount': { en: "Don't have an account?", ru: 'Нет аккаунта?', cz: 'Nemáte účet?' },
  'login.signUp': { en: 'Sign up', ru: 'Зарегистрироваться', cz: 'Registrovat se' },
  'login.failed': { en: 'Login failed', ru: 'Ошибка входа', cz: 'Přihlášení se nezdařilo' },
  'login.forgotPassword': { en: 'Forgot password?', ru: 'Забыли пароль?', cz: 'Zapomněli jste heslo?' },
  'forgot.subtitle': {
    en: 'Enter your email and we will send a reset link if an account exists.',
    ru: 'Укажите email — мы отправим ссылку для сброса, если аккаунт существует.',
    cz: 'Zadejte e-mail a pokud účet existuje, pošleme odkaz pro obnovení.',
  },
  'forgot.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  'forgot.submit': { en: 'Send reset link', ru: 'Отправить ссылку', cz: 'Odeslat odkaz' },
  'forgot.sending': { en: 'Sending...', ru: 'Отправка...', cz: 'Odesílání...' },
  'forgot.successTitle': { en: 'Check your email', ru: 'Проверьте почту', cz: 'Zkontrolujte e-mail' },
  'forgot.success': {
    en: 'If an account with this email exists, a reset link has been sent. The link is valid for 30 minutes.',
    ru: 'Если аккаунт с таким email существует, ссылка для сброса отправлена. Ссылка действует 30 минут.',
    cz: 'Pokud účet s tímto e-mailem existuje, odkaz pro obnovení byl odeslán. Odkaz je platný 30 minut.',
  },
  'forgot.backToLogin': { en: 'Back to sign in', ru: 'Вернуться ко входу', cz: 'Zpět k přihlášení' },
  'forgot.failed': {
    en: 'Could not send the reset link. Try again later.',
    ru: 'Не удалось отправить ссылку для сброса. Попробуйте позже.',
    cz: 'Odkaz pro obnovení se nepodařilo odeslat. Zkuste to později.',
  },
  'reset.subtitle': { en: 'Choose a new password for your account.', ru: 'Придумайте новый пароль для аккаунта.', cz: 'Zvolte nové heslo pro svůj účet.' },
  'reset.newPassword': { en: 'New password', ru: 'Новый пароль', cz: 'Nové heslo' },
  'reset.confirmPassword': { en: 'Repeat new password', ru: 'Повторите новый пароль', cz: 'Zopakujte nové heslo' },
  'reset.submit': { en: 'Change password', ru: 'Изменить пароль', cz: 'Změnit heslo' },
  'reset.saving': { en: 'Saving...', ru: 'Сохранение...', cz: 'Ukládání...' },
  'reset.successTitle': { en: 'Password changed', ru: 'Пароль изменён', cz: 'Heslo změněno' },
  'reset.success': {
    en: 'Your password has been changed. Sign in with the new password; other sessions were signed out.',
    ru: 'Пароль изменён. Войдите с новым паролем; остальные сеансы завершены.',
    cz: 'Heslo bylo změněno. Přihlaste se novým heslem; ostatní relace byly odhlášeny.',
  },
  'reset.invalidTitle': { en: 'Link is not valid', ru: 'Ссылка недействительна', cz: 'Odkaz není platný' },
  'reset.invalid': {
    en: 'This reset link is invalid, has expired, or has already been used.',
    ru: 'Эта ссылка для сброса недействительна, истекла или уже была использована.',
    cz: 'Tento odkaz pro obnovení je neplatný, vypršel nebo už byl použit.',
  },
  'reset.requestNew': { en: 'Request a new link', ru: 'Запросить новую ссылку', cz: 'Vyžádat nový odkaz' },
  'reset.backToLogin': { en: 'Back to sign in', ru: 'Вернуться ко входу', cz: 'Zpět k přihlášení' },
  'reset.failed': {
    en: 'Could not change the password. Try again later.',
    ru: 'Не удалось изменить пароль. Попробуйте позже.',
    cz: 'Heslo se nepodařilo změnit. Zkuste to později.',
  },
  
  'dashboard.title': { en: 'Workday', ru: 'Рабочий день', cz: 'Pracovní den' },
  'dashboard.subtitle': { en: 'Appointments and the work ahead, in one place.', ru: 'Записи и дела на сегодня — в одном месте.', cz: 'Dnešní návštěvy a práce na jednom místě.' },
  'dashboard.monthlyRevenue': { en: 'Monthly Revenue', ru: 'Месячный доход', cz: 'Měsíční příjem' },
  'dashboard.monthlyProfit': { en: 'Monthly Profit', ru: 'Месячная прибыль', cz: 'Měsíční zisk' },
  'dashboard.monthlyExpenses': { en: 'Monthly Expenses', ru: 'Месячные расходы', cz: 'Měsíční výdaje' },
  'dashboard.profitMargin': { en: 'Profit Margin', ru: 'Рентабельность', cz: 'Zisková marže' },
  'dashboard.margin': { en: 'Margin', ru: 'Маржа', cz: 'Marže' },
  'dashboard.thisMonth': { en: 'This month', ru: 'Этот месяц', cz: 'Tento měsíc' },
  'dashboard.reservations': { en: 'Reservations', ru: 'Бронирования', cz: 'Rezervace' },
  'dashboard.totalVisits': { en: 'Total Visits', ru: 'Всего визитов', cz: 'Celkem návštěv' },
  'dashboard.completedVisits': { en: 'Completed', ru: 'Завершено', cz: 'Dokončeno' },
  'dashboard.totalClients': { en: 'Total Clients', ru: 'Всего клиентов', cz: 'Celkem klientů' },
  'dashboard.newClients': { en: 'New Clients', ru: 'Новые клиенты', cz: 'Noví klienti' },
  'dashboard.averageSpending': { en: 'Average Spending', ru: 'Средние траты', cz: 'Průměrné výdaje' },
  'dashboard.quickStatus': { en: 'Quick Status', ru: 'Быстрый статус', cz: 'Rychlý status' },
  'dashboard.noVisits': { en: 'No visits yet', ru: 'Пока нет визитов', cz: 'Zatím žádné návštěvy' },
  'dashboard.noVisitsDescription': { en: 'Create your first visit to see statistics here', ru: 'Создайте первый визит, чтобы увидеть статистику', cz: 'Vytvořte první návštěvu, abyste zde viděli statistiky' },
  'dashboard.noClients': { en: 'No clients yet', ru: 'Пока нет клиентов', cz: 'Zatím žádní klienti' },
  'dashboard.noClientsDescription': { en: 'Add your first client to see statistics here', ru: 'Добавьте первого клиента, чтобы увидеть статистику', cz: 'Přidejte svého prvního klienta, abyste zde viděli statistiky' },
  'dashboard.noData': { en: 'No data available', ru: 'Нет данных', cz: 'Žádná data' },
  'dashboard.noProfitData': { en: 'No profit data available for this month', ru: 'Нет данных о прибыли за этот месяц', cz: 'Žádná data o zisku za tento měsíc' },
  
  'clients.title': { en: 'Clients', ru: 'Клиенты', cz: 'Klienti' },
  'clients.addClient': { en: 'Add Client', ru: 'Добавить клиента', cz: 'Přidat klienta' },
  'clients.searchPlaceholder': { en: 'Search by name, phone, or email...', ru: 'Поиск по имени, телефону или email...', cz: 'Hledat podle jména, telefonu nebo emailu...' },
  'clients.allGenders': { en: 'All Genders', ru: 'Все полы', cz: 'Všechna pohlaví' },
  'clients.male': { en: 'Male', ru: 'Мужской', cz: 'Muž' },
  'clients.female': { en: 'Female', ru: 'Женский', cz: 'Žena' },
  'clients.other': { en: 'Other', ru: 'Другое', cz: 'Jiné' },
  'clients.clearFilters': { en: 'Clear filters', ru: 'Очистить фильтры', cz: 'Vymazat filtry' },
  'clients.noClientsMatch': { en: 'No clients match your filters', ru: 'Нет клиентов, соответствующих фильтрам', cz: 'Žádní klienti neodpovídají filtru' },
  'clients.noClientsFound': { en: 'No clients found', ru: 'Клиенты не найдены', cz: 'Klienti nenalezeni' },
  'clients.name': { en: 'Name', ru: 'Имя', cz: 'Jméno' },
  'clients.phone': { en: 'Phone', ru: 'Телефон', cz: 'Telefon' },
  'clients.email': { en: 'Email', ru: 'Email', cz: 'Email' },
  'clients.open': { en: 'Open', ru: 'Открыть', cz: 'Otevřít' },
  'clientWorkspace.back': { en: 'Back to clients', ru: 'К списку клиентов', cz: 'Zpět na klienty' },
  'clientWorkspace.totalVisits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'clientWorkspace.completedVisits': { en: 'Completed', ru: 'Завершено', cz: 'Dokončeno' },
  'clientWorkspace.cancelledVisits': { en: 'Cancelled', ru: 'Отменено', cz: 'Zrušeno' },
  'clientWorkspace.paidTotal': { en: 'Paid', ru: 'Оплачено', cz: 'Zaplaceno' },
  'clientWorkspace.nextVisit': { en: 'Next visit', ru: 'Ближайший визит', cz: 'Nejbližší návštěva' },
  'clientWorkspace.noUpcoming': { en: 'No upcoming visits', ru: 'Ближайших визитов нет', cz: 'Žádná nadcházející návštěva' },
  'clientWorkspace.history': { en: 'Visit history', ru: 'История визитов', cz: 'Historie návštěv' },
  'clientWorkspace.noVisits': { en: 'No visits yet', ru: 'Визитов пока нет', cz: 'Zatím žádné návštěvy' },
  'clientWorkspace.details': { en: 'Details', ru: 'Подробнее', cz: 'Podrobnosti' },
  'clientWorkspace.hideDetails': { en: 'Hide', ru: 'Скрыть', cz: 'Skrýt' },
  'clientWorkspace.questionnaire': { en: 'Questionnaire', ru: 'Анкета', cz: 'Dotazník' },
  'clientWorkspace.noQuestionnaire': { en: 'No questionnaire filled in', ru: 'Анкета не заполнена', cz: 'Dotazník není vyplněn' },
  'clientWorkspace.attachments': { en: 'Files', ru: 'Файлы', cz: 'Soubory' },
  'clientWorkspace.noAttachments': { en: 'No files', ru: 'Файлов нет', cz: 'Žádné soubory' },
  'clientWorkspace.notes': { en: 'Notes', ru: 'Заметки', cz: 'Poznámky' },
  'clientWorkspace.noNotes': { en: 'No notes yet', ru: 'Заметок пока нет', cz: 'Zatím žádné poznámky' },
  'clientWorkspace.notePlaceholder': { en: 'A note only your team can see', ru: 'Заметка, которую видит только команда', cz: 'Poznámka viditelná jen pro váš tým' },
  'clientWorkspace.addNote': { en: 'Add note', ru: 'Добавить заметку', cz: 'Přidat poznámku' },
  'clientWorkspace.deleteNoteConfirm': { en: 'Delete this note?', ru: 'Удалить эту заметку?', cz: 'Smazat tuto poznámku?' },
  'clientWorkspace.noteError': { en: 'Could not save the note', ru: 'Не удалось сохранить заметку', cz: 'Poznámku se nepodařilo uložit' },
  'clientWorkspace.tags': { en: 'Tags', ru: 'Теги', cz: 'Štítky' },
  'clientWorkspace.noTags': { en: 'No tags yet', ru: 'Тегов пока нет', cz: 'Zatím žádné štítky' },
  'clientWorkspace.tagPlaceholder': { en: 'Add a tag', ru: 'Добавить тег', cz: 'Přidat štítek' },
  'clientWorkspace.addTag': { en: 'Add', ru: 'Добавить', cz: 'Přidat' },
  'clientWorkspace.preferences': { en: 'Preferences', ru: 'Предпочтения', cz: 'Preference' },
  'clientWorkspace.preferencesPlaceholder': { en: 'Anything the team should know before a visit', ru: 'Что команде важно знать до визита', cz: 'Co má tým vědět před návštěvou' },
  'clientWorkspace.saveProfile': { en: 'Save tags and preferences', ru: 'Сохранить теги и предпочтения', cz: 'Uložit štítky a preference' },
  'clientWorkspace.profileError': { en: 'Could not save tags and preferences', ru: 'Не удалось сохранить теги и предпочтения', cz: 'Štítky a preference se nepodařilo uložit' },
  'clientWorkspace.forbidden': { en: 'You do not have permission to change this client', ru: 'Недостаточно прав для изменения клиента', cz: 'Nemáte oprávnění měnit tohoto klienta' },
  'clientWorkspace.dataUnavailable': { en: 'This section is unavailable', ru: 'Этот раздел недоступен', cz: 'Tato část není dostupná' },
  
  'services.title': { en: 'Services', ru: 'Услуги', cz: 'Služby' },
  'services.addService': { en: 'Add Service', ru: 'Добавить услугу', cz: 'Přidat službu' },
  'services.searchPlaceholder': { en: 'Search by service name...', ru: 'Поиск по названию услуги...', cz: 'Hledat podle názvu služby...' },
  'services.allServices': { en: 'All Services', ru: 'Все услуги', cz: 'Všechny služby' },
  'services.activeOnly': { en: 'Active Only', ru: 'Только активные', cz: 'Pouze aktivní' },
  'services.inactiveOnly': { en: 'Inactive Only', ru: 'Только неактивные', cz: 'Pouze neaktivní' },
  'services.clearFilters': { en: 'Clear filters', ru: 'Очистить фильтры', cz: 'Vymazat filtry' },
  'services.noServicesMatch': { en: 'No services match your filters', ru: 'Нет услуг, соответствующих фильтрам', cz: 'Žádné služby neodpovídají filtru' },
  'services.noServicesFound': { en: 'No services found', ru: 'Услуги не найдены', cz: 'Služby nenalezeny' },
  'services.name': { en: 'Name', ru: 'Название', cz: 'Název' },
  'services.duration': { en: 'Duration', ru: 'Длительность', cz: 'Délka trvání' },
  'services.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'services.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'services.active': { en: 'Active', ru: 'Активна', cz: 'Aktivní' },
  'services.inactive': { en: 'Inactive', ru: 'Неактивна', cz: 'Neaktivní' },
  'services.min': { en: 'min', ru: 'мин', cz: 'min' },
  
  'visits.title': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'visits.editVisit': { en: 'Edit visit', ru: 'Редактирование визита', cz: 'Upravit návštěvu' },
  'visits.newVisit': { en: 'New Visit', ru: 'Новый визит', cz: 'Nová návštěva' },
  'visits.searchPlaceholder': { en: 'Search by service or client name...', ru: 'Поиск по услуге или клиенту...', cz: 'Hledat podle služby nebo klienta...' },
  'visits.allStatuses': { en: 'All Statuses', ru: 'Все статусы', cz: 'Všechny stavy' },
  'visits.planned': { en: 'Planned', ru: 'Запланирован', cz: 'Plánováno' },
  'visits.inProgress': { en: 'In Progress', ru: 'В процессе', cz: 'Probíhá' },
  'visits.completed': { en: 'Completed', ru: 'Завершен', cz: 'Dokončeno' },
  'visits.cancelled': { en: 'Cancelled', ru: 'Отменен', cz: 'Zrušeno' },
  'visits.clearFilters': { en: 'Clear filters', ru: 'Очистить фильтры', cz: 'Vymazat filtry' },
  'visits.fromDate': { en: 'From date', ru: 'С даты', cz: 'Od data' },
  'visits.toDate': { en: 'To date', ru: 'По дату', cz: 'Do data' },
  'visits.noVisitsMatch': { en: 'No visits match your filters', ru: 'Нет визитов, соответствующих фильтрам', cz: 'Žádné návštěvy neodpovídají filtru' },
  'visits.noVisitsFound': { en: 'No visits found', ru: 'Визиты не найдены', cz: 'Návštěvy nenalezeny' },
  'visits.date': { en: 'Date', ru: 'Дата', cz: 'Datum' },
  'visits.service': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'visits.specialist': { en: 'Specialist', ru: 'Специалист', cz: 'Specialista' },
  'visits.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'visits.client': { en: 'Client', ru: 'Клиент', cz: 'Klient' },
  'visits.clientList': { en: 'Client List', ru: 'Список клиентов', cz: 'Seznam klientů' },
  'visits.clientSearch': { en: 'Search Client', ru: 'Поиск клиента', cz: 'Vyhledat klienta' },
  'visits.searchClientPlaceholder': { en: 'Phone, email or client name...', ru: 'Телефон, email или имя клиента...', cz: 'Telefon, email nebo jméno klienta...' },
  'visits.clientNotFound': { en: 'No such client among yours', ru: 'Среди ваших клиентов такого нет', cz: 'Mezi vašimi klienty takový není' },
  'visits.searching': { en: 'Searching...', ru: 'Поиск...', cz: 'Vyhledávání...' },
  'visits.clientFromOtherBusiness': { en: 'Client from another business', ru: 'Клиент из другого бизнеса', cz: 'Klient z jiného podniku' },
  'visits.addToMyBusiness': { en: 'Add to my business', ru: 'Добавить в мой бизнес', cz: 'Přidat do mého podniku' },
  'visits.basicMedicalInfo': { en: 'Basic Medical Information', ru: 'Базовая медицинская информация', cz: 'Základní lékařské informace' },
  'visits.serviceName': { en: 'Service Name (if custom)', ru: 'Название услуги (если нестандартная)', cz: 'Název služby (pokud vlastní)' },
  'visits.startDateTime': { en: 'Start Date & Time', ru: 'Дата и время начала', cz: 'Datum a čas začátku' },
  'visits.endDateTime': { en: 'End Date & Time', ru: 'Дата и время окончания', cz: 'Datum a čas konce' },
  'visits.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'visits.notes': { en: 'Notes', ru: 'Примечания', cz: 'Poznámky' },
  'visits.selectClient': { en: 'Select client...', ru: 'Выберите клиента...', cz: 'Vyberte klienta...' },
  'visits.selectService': { en: 'Select service...', ru: 'Выберите услугу...', cz: 'Vyberte službu...' },
  'visits.createVisit': { en: 'Create Visit', ru: 'Создать визит', cz: 'Vytvořit návštěvu' },
  'visits.updateVisit': { en: 'Update Visit', ru: 'Обновить визит', cz: 'Aktualizovat návštěvu' },
  'visits.addService': { en: 'Add service', ru: 'Добавить услугу', cz: 'Přidat službu' },
  'visits.removeService': { en: 'Remove service', ru: 'Убрать услугу', cz: 'Odebrat službu' },
  'visits.moveServiceUp': { en: 'Move up', ru: 'Выше', cz: 'Nahoru' },
  'visits.moveServiceDown': { en: 'Move down', ru: 'Ниже', cz: 'Dolů' },
  'visits.chainHint': { en: 'Services run one after another from the start time. The server calculates the end, duration and total.', ru: 'Услуги идут подряд от времени начала. Конец, длительность и сумму считает сервер.', cz: 'Služby jdou po sobě od času začátku. Konec, délku a celkovou cenu počítá server.' },
  'visits.itemsIncomplete': { en: 'Choose a service for every row', ru: 'Выберите услугу в каждой строке', cz: 'Vyberte službu v každém řádku' },
  'visits.chainTotal': { en: 'Total', ru: 'Итого', cz: 'Celkem' },
  'visits.chainDuration': { en: 'Total duration', ru: 'Общая длительность', cz: 'Celková délka' },
  'visits.chainEnd': { en: 'Ends around', ru: 'Окончание около', cz: 'Konec kolem' },
  'visits.selectPaymentMethod': { en: 'Select payment method', ru: 'Выберите способ оплаты', cz: 'Vyberte způsob platby' },
  'visits.paymentOther': { en: 'Other', ru: 'Другое', cz: 'Jiné' },
  
  'calendar.view': { en: 'Calendar view', ru: 'Вид календаря', cz: 'Zobrazení kalendáře' },
  'calendar.timeGrid': { en: 'Day schedule, all 24 hours', ru: 'Расписание дня, все 24 часа', cz: 'Denní rozvrh, všech 24 hodin' },
  'calendar.title': { en: 'Calendar', ru: 'Календарь', cz: 'Kalendář' },
  'calendar.simpleViewDescription': { en: 'Click on a date to create a visit, or click on an existing visit to edit it.', ru: 'Нажмите на дату, чтобы создать визит, или нажмите на существующий визит, чтобы отредактировать его.', cz: 'Klikněte na datum pro vytvoření návštěvy nebo klikněte na existující návštěvu pro úpravu.' },
  'calendar.advancedViewDescription': { en: 'Click on a time slot to create a visit, or click on an existing visit to edit it.', ru: 'Нажмите на временной слот, чтобы создать визит, или нажмите на существующий визит, чтобы отредактировать его.', cz: 'Klikněte na časový slot pro vytvoření návštěvy nebo klikněte na existující návštěvu pro úpravu.' },
  'calendar.simpleView': { en: 'Simple View', ru: 'Простой вид', cz: 'Jednoduché zobrazení' },
  'calendar.advancedView': { en: 'Advanced View', ru: 'Расширенный вид', cz: 'Pokročilé zobrazení' },
  'calendar.noVisits': { en: 'No visits on this date', ru: 'Нет визитов на эту дату', cz: 'Na tento den žádné návštěvy' },
  'calendar.visit': { en: 'visit', ru: 'визит', cz: 'návštěva' },
  'calendar.visits': { en: 'visits', ru: 'визитов', cz: 'návštěv' },
  'calendar.backToCalendar': { en: 'Back to Calendar', ru: 'Назад к календарю', cz: 'Zpět do kalendáře' },
  'calendar.previous': { en: 'Previous', ru: 'Назад', cz: 'Předchozí' },
  'calendar.next': { en: 'Next', ru: 'Вперед', cz: 'Další' },
  'calendar.more': { en: 'more', ru: 'еще', cz: 'více' },
  'calendar.monthView': { en: 'Month view', ru: 'Вид месяца', cz: 'Měsíční zobrazení' },
  'calendar.eventsThisMonth': { en: 'events this month', ru: 'событий в этом месяце', cz: 'událostí tento měsíc' },
  'calendar.selectedDay': { en: 'Selected day', ru: 'Выбранный день', cz: 'Vybraný den' },
  'calendar.insights': { en: 'Insights', ru: 'Аналитика', cz: 'Přehledy' },
  'calendar.insightsTitle': { en: 'This month breakdown', ru: 'Разбивка этого месяца', cz: 'Rozpis tohoto měsíce' },
  'calendar.searchEvents': { en: 'Search events...', ru: 'Поиск событий...', cz: 'Hledat události...' },
  'calendar.dayView': { en: 'Day view', ru: 'День', cz: 'Denní zobrazení' },
  'calendar.dayViewDescription': { en: 'One day at a glance: time, client, price and status of every visit.', ru: 'Один день целиком: время, клиент, цена и статус каждого визита.', cz: 'Jeden den přehledně: čas, klient, cena a stav každé návštěvy.' },
  'calendar.daySchedule': { en: 'Daily schedule', ru: 'Расписание на день', cz: 'Denní rozvrh' },
  'calendar.today': { en: 'Today', ru: 'Сегодня', cz: 'Dnes' },
  'calendar.staffColumns': { en: 'By specialist', ru: 'По мастерам', cz: 'Podle specialistů' },
  'calendar.noStaff': { en: 'No specialists to show', ru: 'Нет мастеров для отображения', cz: 'Žádní specialisté k zobrazení' },
  'calendar.weekView': { en: 'Week view', ru: 'Неделя', cz: 'Týdenní zobrazení' },
  'calendar.weekViewDescription': { en: 'Seven days side by side, every visit at its own time.', ru: 'Семь дней рядом, каждый визит на своём времени.', cz: 'Sedm dní vedle sebe, každá návštěva ve svém čase.' },
  'calendar.chain': { en: 'Chain of services', ru: 'Цепочка услуг', cz: 'Řetěz služeb' },
  'calendar.chainPosition': { en: '{position} of {total}', ru: '{position} из {total}', cz: '{position} z {total}' },
  'calendar.chainServices': { en: 'Services in this visit', ru: 'Услуги в этом визите', cz: 'Služby v této návštěvě' },
  'calendar.free': { en: 'Free', ru: 'Свободно', cz: 'Volno' },
  'calendar.blocked': { en: 'Blocked', ru: 'Заблокировано', cz: 'Blokováno' },
  'calendar.nonWorking': { en: 'Non-working hours', ru: 'Нерабочие часы', cz: 'Nepracovní hodiny' },
  'calendar.moveTitle': { en: 'Move visit', ru: 'Перенести визит', cz: 'Přesunout návštěvu' },
  'calendar.moveDate': { en: 'Date', ru: 'Дата', cz: 'Datum' },
  'calendar.moveTime': { en: 'Time', ru: 'Время', cz: 'Čas' },
  'calendar.moveSubmit': { en: 'Move', ru: 'Перенести', cz: 'Přesunout' },
  'calendar.moving': { en: 'Moving...', ru: 'Переносим...', cz: 'Přesouvám...' },
  'calendar.moveConflict': { en: 'This time is already taken. The visit stayed where it was.', ru: 'Это время уже занято. Визит остался на прежнем месте.', cz: 'Tento čas je již obsazen. Návštěva zůstala na původním místě.' },
  'calendar.moveError': { en: 'Could not move the visit', ru: 'Не удалось перенести визит', cz: 'Návštěvu se nepodařilo přesunout' },
  'calendar.moveInvalidTime': { en: 'Choose a valid date and time', ru: 'Укажите корректные дату и время', cz: 'Zadejte platné datum a čas' },
  
  'employees.title': { en: 'Employees', ru: 'Сотрудники', cz: 'Zaměstnanci' },
  'employees.add_employee': { en: 'Add Employee', ru: 'Добавить сотрудника', cz: 'Přidat zaměstnance' },
  'employees.search_placeholder': { en: 'Search employees...', ru: 'Поиск сотрудников...', cz: 'Hledat zaměstnance...' },
  'employees.active_only': { en: 'Active only', ru: 'Только активные', cz: 'Pouze aktivní' },
  'employees.employee': { en: 'Employee', ru: 'Сотрудник', cz: 'Zaměstnanec' },
  'employees.position': { en: 'Position', ru: 'Должность', cz: 'Pozice' },
  'employees.commission': { en: 'Commission', ru: 'Комиссия', cz: 'Provize' },
  'employees.base_salary': { en: 'Base Salary', ru: 'Базовая зарплата', cz: 'Základní plat' },
  'employees.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'employees.hired_at': { en: 'Hired At', ru: 'Нанят', cz: 'Najato' },
  'employees.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'employees.no_employees': { en: 'No employees found', ru: 'Сотрудники не найдены', cz: 'Žádní zaměstnanci nenalezeni' },
  'employees.unknown': { en: 'Unknown', ru: 'Неизвестно', cz: 'Neznámý' },
  'employees.active': { en: 'Active', ru: 'Активен', cz: 'Aktivní' },
  'employees.inactive': { en: 'Inactive', ru: 'Неактивен', cz: 'Neaktivní' },
  'employees.edit_employee': { en: 'Edit Employee', ru: 'Редактировать сотрудника', cz: 'Upravit zaměstnance' },
  'employees.fire': { en: 'Fire', ru: 'Уволить', cz: 'Propustit' },
  'employees.confirm_fire': { en: 'Are you sure you want to fire {name}?', ru: 'Вы уверены, что хотите уволить {name}?', cz: 'Opravdu chcete propustit {name}?' },
  'employees.salary': { en: 'Salary', ru: 'Зарплата', cz: 'Plat' },
  'employees.form_coming_soon': { en: 'Employee management form is coming soon', ru: 'Форма управления сотрудниками скоро появится', cz: 'Formulář pro správu zaměstnanců brzy přijde' },
  'employees.access_denied': { en: 'You do not have permission to view this page', ru: 'У вас нет доступа к этой странице', cz: 'Nemáte oprávnění k zobrazení této stránky' },
  'employees.select_user': { en: 'Select User', ru: 'Выберите пользователя', cz: 'Vyberte uživatele' },
  'employees.select_user_placeholder': { en: 'Select a user...', ru: 'Выберите пользователя...', cz: 'Vyberte uživatele...' },
  'employees.select_user_required': { en: 'Please select a user', ru: 'Пожалуйста, выберите пользователя', cz: 'Prosím vyberte uživatele' },
  'employees.no_available_users': { en: 'No available users found', ru: 'Доступные пользователи не найдены', cz: 'Nebyli nalezeni dostupní uživatelé' },
  'employees.position_placeholder': { en: 'e.g., Massage Therapist, Administrator', ru: 'например, Массажист, Администратор', cz: 'např. Masér, Administrátor' },
  'employees.permissions': { en: 'Permissions', ru: 'Права доступа', cz: 'Oprávnění' },
  'employees.permission_create_visits': { en: 'Can create visits', ru: 'Может создавать визиты', cz: 'Může vytvářet návštěvy' },
  'employees.permission_edit_clients': { en: 'Can edit clients', ru: 'Может редактировать клиентов', cz: 'Může upravovat klienty' },
  'employees.permission_view_financials': { en: 'Can view financial information', ru: 'Может просматривать финансовую информацию', cz: 'Může zobrazovat finanční informace' },
  'employees.permission_manage_services': { en: 'Can manage services', ru: 'Может управлять услугами', cz: 'Může spravovat služby' },
  'employees.edit_salary': { en: 'Edit Salary', ru: 'Редактировать зарплату', cz: 'Upravit plat' },
  'employees.search_user': { en: 'Search by name, email or phone...', ru: 'Поиск по имени, email или телефону...', cz: 'Vyhledat podle jména, emailu nebo telefonu...' },
  'employees.no_users_found': { en: 'No users found', ru: 'Пользователи не найдены', cz: 'Uživatelé nenalezeni' },
  'employees.commission_invalid_range': { en: 'Commission must be between 0 and 100%', ru: 'Комиссия должна быть от 0 до 100%', cz: 'Provize musí být mezi 0 a 100%' },
  'employees.base_salary_invalid': { en: 'Base salary cannot be negative', ru: 'Базовая зарплата не может быть отрицательной', cz: 'Základní plat nemůže být záporný' },
  
  'salary.my_salary': { en: 'My Salary', ru: 'Моя зарплата', cz: 'Můj plat' },
  'salary.current_unpaid': { en: 'Current Unpaid Salary', ru: 'Текущая невыплаченная зарплата', cz: 'Aktuální nevyplacený plat' },
  'salary.unpaid': { en: 'Unpaid', ru: 'Не выплачено', cz: 'Nevyplaceno' },
  'salary.period': { en: 'Period', ru: 'Период', cz: 'Období' },
  'salary.total_visits': { en: 'Total Visits', ru: 'Всего визитов', cz: 'Celkem návštěv' },
  'salary.completed': { en: 'Completed', ru: 'Завершено', cz: 'Dokončeno' },
  'salary.total': { en: 'Total', ru: 'Всего', cz: 'Celkem' },
  'salary.total_revenue': { en: 'Total Revenue', ru: 'Общий доход', cz: 'Celkový příjem' },
  'salary.total_salary': { en: 'Total Salary', ru: 'Итоговая зарплата', cz: 'Celkový plat' },
  'salary.base': { en: 'Base', ru: 'Базовая', cz: 'Základ' },
  'salary.commission': { en: 'Commission', ru: 'Комиссия', cz: 'Provize' },
  'salary.notes': { en: 'Notes', ru: 'Заметки', cz: 'Poznámky' },
  'salary.calculated_at': { en: 'Calculated at', ru: 'Рассчитано', cz: 'Vypočítáno' },
  'salary.no_unpaid_salary': { en: 'You have no unpaid salary at the moment', ru: 'У вас нет невыплаченной зарплаты', cz: 'Momentálně nemáte nevyplacený plat' },
  'salary.history': { en: 'Salary History', ru: 'История зарплат', cz: 'Historie platů' },
  'salary.visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'salary.revenue': { en: 'Revenue', ru: 'Доход', cz: 'Příjem' },
  'salary.salary': { en: 'Salary', ru: 'Зарплата', cz: 'Plat' },
  'salary.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'salary.paid_at': { en: 'Paid At', ru: 'Выплачено', cz: 'Vyplaceno' },
  'salary.cancelled': { en: 'cancelled', ru: 'отменено', cz: 'zrušeno' },
  'salary.paid': { en: 'Paid', ru: 'Выплачено', cz: 'Vyplaceno' },
  'salary.access_denied': { en: 'You do not have permission to view this page', ru: 'У вас нет доступа к этой странице', cz: 'Nemáte oprávnění k zobrazení této stránky' },
  'salary.no_history': { en: 'No salary history available', ru: 'История зарплат отсутствует', cz: 'Historie platů není k dispozici' },
  'salary.mark_paid': { en: 'Mark as Paid', ru: 'Отметить как выплаченную', cz: 'Označit jako vyplacenou' },
  'salary.mark_paid_confirm': { en: 'Are you sure you want to mark this salary as paid?', ru: 'Вы уверены, что хотите отметить эту зарплату как выплаченную?', cz: 'Opravdu chcete označit tento plat jako vyplacený?' },
  'salary.calculate_salary': { en: 'Calculate Salary', ru: 'Рассчитать зарплату', cz: 'Vypočítat plat' },
  'salary.calculate_success': { en: 'Salary calculated successfully', ru: 'Зарплата успешно рассчитана', cz: 'Plat byl úspěšně vypočítán' },
  'salary.calculate_error': { en: 'Failed to calculate salary', ru: 'Не удалось рассчитать зарплату', cz: 'Nepodařilo se vypočítat plat' },
  'salary.mark_paid_success': { en: 'Salary marked as paid', ru: 'Зарплата отмечена как выплаченная', cz: 'Plat byl označen jako vyplacený' },
  'salary.mark_paid_error': { en: 'Failed to mark salary as paid', ru: 'Не удалось отметить зарплату как выплаченную', cz: 'Nepodařilo se označit plat jako vyplacený' },
  'salary.view_details': { en: 'View Details', ru: 'Просмотреть детали', cz: 'Zobrazit detaily' },
  'salary.calculated_by': { en: 'Calculated by', ru: 'Рассчитано', cz: 'Vypočítáno' },
  'salary.adjustments': { en: 'Adjustments', ru: 'Начисления/удержания', cz: 'Příplatky a srážky' },
  'salary.adjustments_total': { en: 'Adjustments Total', ru: 'Итого начислений', cz: 'Celkem příplatků' },
  'salary.total_with_adjustments': { en: 'Total with Adjustments', ru: 'Итого с начислениями', cz: 'Celkem s příplatky' },
  'salary.paid_amount': { en: 'Paid Amount', ru: 'Выплачено', cz: 'Vyplaceno' },
  'salary.remaining': { en: 'Remaining', ru: 'Остаток', cz: 'Zbývá' },
  'salary.payment_status': { en: 'Payment Status', ru: 'Статус выплаты', cz: 'Stav platby' },
  'salary.status.unpaid': { en: 'Unpaid', ru: 'Не выплачено', cz: 'Nevyplaceno' },
  'salary.status.partial': { en: 'Partially Paid', ru: 'Частично выплачено', cz: 'Částečně vyplaceno' },
  'salary.status.paid': { en: 'Paid', ru: 'Выплачено', cz: 'Vyplaceno' },
  'salary.status.completed': { en: 'Completed', ru: 'Завершено', cz: 'Dokončeno' },
  'salary.status.pending': { en: 'Pending', ru: 'Ожидается', cz: 'Čeká se' },
  'salary.status.failed': { en: 'Failed', ru: 'Не удалось', cz: 'Selhalo' },
  'salary.addAdjustment': { en: 'Add Adjustment', ru: 'Добавить начисление/удержание', cz: 'Přidat příplatek / srážku' },
  'salary.adjustmentType': { en: 'Type', ru: 'Тип', cz: 'Typ' },
  'salary.amount': { en: 'Amount', ru: 'Сумма', cz: 'Částka' },
  'salary.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'salary.bonus': { en: 'Bonus', ru: 'Бонус', cz: 'Bonus' },
  'salary.penalty': { en: 'Penalty', ru: 'Штраф', cz: 'Pokuta' },
  'salary.overtime': { en: 'Overtime', ru: 'Переработка', cz: 'Přesčasy' },
  'salary.allowance': { en: 'Allowance', ru: 'Надбавка', cz: 'Příplatek' },
  'salary.deduction': { en: 'Deduction', ru: 'Удержание', cz: 'Srážka' },
  'salary.willBeAdded': { en: 'Will be added to salary', ru: 'Будет добавлено к зарплате', cz: 'Bude přidáno k platu' },
  'salary.willBeDeducted': { en: 'Will be deducted from salary', ru: 'Будет вычтено из зарплаты', cz: 'Bude odečteno z platu' },
  'salary.adjustmentDescription': { en: 'Adjustment description', ru: 'Описание начисления/удержания', cz: 'Popis příplatku nebo srážky' },
  'salary.invalidAmount': { en: 'Invalid amount', ru: 'Неверная сумма', cz: 'Neplatná částka' },
  'salary.pending': { en: 'Pending', ru: 'Ожидается', cz: 'Čeká se' },
  'salary.failed': { en: 'Failed', ru: 'Не удалось', cz: 'Selhalo' },
  'salary.payments': { en: 'Payments', ru: 'Выплаты', cz: 'Platby' },
  'salary.recordPayment': { en: 'Record Payment', ru: 'Зарегистрировать выплату', cz: 'Zaznamenat platbu' },
  'salary.paymentDate': { en: 'Payment Date', ru: 'Дата выплаты', cz: 'Datum platby' },
  'salary.paymentMethod': { en: 'Payment Method', ru: 'Способ оплаты', cz: 'Způsob platby' },
  'salary.paymentMethod.cash': { en: 'Cash', ru: 'Наличные', cz: 'Hotovost' },
  'salary.paymentMethod.card': { en: 'Card', ru: 'Карта', cz: 'Karta' },
  'salary.paymentMethod.transfer': { en: 'Transfer', ru: 'Перевод', cz: 'Převod' },
  'salary.paymentMethod.other': { en: 'Other', ru: 'Другое', cz: 'Jiné' },
  'salary.allMethods': { en: 'All Methods', ru: 'Все методы', cz: 'Všechny způsoby platby' },
  'salary.transfer': { en: 'Transfer', ru: 'Перевод', cz: 'Převod' },
  'salary.remainingAmount': { en: 'Remaining Amount', ru: 'Остаток к выплате', cz: 'Zbývající částka' },
  'salary.exceedsRemaining': { en: 'Amount exceeds remaining amount', ru: 'Сумма превышает остаток', cz: 'Částka překračuje zbývající částku' },
  'salary.paymentNotes': { en: 'Payment notes', ru: 'Дополнительная информация о выплате', cz: 'Poznámky k platbě' },
  'salary.deleteAdjustmentConfirm': { en: 'Delete this adjustment?', ru: 'Удалить начисление?', cz: 'Smazat tento příplatek?' },
  'salary.noAdjustments': { en: 'No adjustments', ru: 'Нет начислений/удержаний', cz: 'Žádné příplatky ani srážky' },
  'salary.noPayments': { en: 'No payments', ru: 'Нет выплат', cz: 'Žádné platby' },
  'salary.tabs.current': { en: 'Current', ru: 'Текущая', cz: 'Aktuální' },
  'salary.tabs.adjustments': { en: 'Adjustments', ru: 'Начисления', cz: 'Příplatky' },
  'salary.tabs.payments': { en: 'Payments', ru: 'Выплаты', cz: 'Platby' },
  'salary.tabs.history': { en: 'History', ru: 'История', cz: 'Historie' },
  'salary.tabs.details': { en: 'Details', ru: 'Детализация', cz: 'Detaily' },
  'salary.tabs.export': { en: 'Export', ru: 'Экспорт', cz: 'Export' },
  'salary.currentCalculation': { en: 'Current Calculation', ru: 'Текущий расчет', cz: 'Aktuální výpočet' },
  'salary.currentSalary': { en: 'Current Salary', ru: 'Текущая зарплата', cz: 'Aktuální plat' },
  'salary.viewSalaryDetails': { en: 'View salary details', ru: 'Просмотр начислений и выплат', cz: 'Přehled výpočtu a výplat' },
  'salary.breakdown': { en: 'Breakdown', ru: 'Детализация', cz: 'Rozpis' },
  'salary.bonuses': { en: 'Bonuses', ru: 'Бонусы', cz: 'Bonusy' },
  'salary.totalVisits': { en: 'Total Visits', ru: 'Всего визитов', cz: 'Celkem návštěv' },
  'salary.totalRevenue': { en: 'Total Revenue', ru: 'Общий доход', cz: 'Celkový příjem' },
  'salary.periodStart': { en: 'Period Start', ru: 'Начало периода', cz: 'Začátek období' },
  'salary.periodEnd': { en: 'Period End', ru: 'Конец периода', cz: 'Konec období' },
  'salary.calculatedAt': { en: 'Calculated at', ru: 'Рассчитано', cz: 'Vypočítáno' },
  'salary.noUnpaidSalary': { en: 'No unpaid salary', ru: 'Нет невыплаченной зарплаты', cz: 'Žádný nevyplacený plat' },
  'salary.noHistory': { en: 'No history', ru: 'Нет истории зарплат', cz: 'Žádná historie' },
  'salary.export': { en: 'Export', ru: 'Экспорт отчета', cz: 'Export reportu' },
  'salary.exportDescription': { en: 'Export detailed salary report', ru: 'Экспортируйте детализированный отчет о зарплате', cz: 'Exportujte podrobný report o platu' },
  'salary.mySalaryReport': { en: 'My Salary Report', ru: 'Отчет по зарплате', cz: 'Report o platu' },
  'salary.personalReport': { en: 'Personal Report', ru: 'Персональный отчет', cz: 'Osobní report' },
  'salary.deleteAdjustment': { en: 'Delete Adjustment', ru: 'Удалить начисление', cz: 'Smazat příplatek' },
  'salary.mySalary': { en: 'My Salary', ru: 'Моя зарплата', cz: 'Můj plat' },
  'salary.fillPeriod': { en: 'Please fill in the period', ru: 'Заполните период', cz: 'Vyplňte období' },
  'salary.selectSalary': { en: 'Select salary from history', ru: 'Выберите зарплату из истории', cz: 'Vyberte plat z historie' },
  
  'nav.business': { en: 'Business', ru: 'Бизнес', cz: 'Podnikání' },
  'nav.employees': { en: 'Employees', ru: 'Сотрудники', cz: 'Zaměstnanci' },
  'nav.my_salary': { en: 'My Salary', ru: 'Моя зарплата', cz: 'Můj plat' },
  'nav.subscription': { en: 'Billing', ru: 'Биллинг', cz: 'Fakturace' },
  'nav.inventory': { en: 'Products', ru: 'Продукты', cz: 'Produkty' },
  'nav.finance': { en: 'Payments', ru: 'Платежи', cz: 'Platby' },
  'nav.analytics': { en: 'Analytics', ru: 'Аналитика', cz: 'Analytika' },
  'nav.loyalty': { en: 'Loyalty', ru: 'Лояльность', cz: 'Věrnost' },
  'nav.settings': { en: 'Settings', ru: 'Настройки', cz: 'Nastavení' },
  'nav.notifications': { en: 'Notifications', ru: 'Уведомления', cz: 'Oznámení' },
  'nav.collapse_menu': { en: 'Collapse menu', ru: 'Свернуть меню', cz: 'Sbalit nabídku' },
  'nav.expand_menu': { en: 'Expand menu', ru: 'Развернуть меню', cz: 'Rozbalit nabídku' },
  'nav.quick': { en: 'Quick navigation', ru: 'Быстрая навигация', cz: 'Rychlá navigace' },
  'nav.more': { en: 'More', ru: 'Ещё', cz: 'Nabídka' },
  'nav.primary': { en: 'PRIMARY', ru: 'ОСНОВНОЕ', cz: 'ZÁKLADNÍ' },
  'nav.manage': { en: 'MANAGE', ru: 'УПРАВЛЕНИЕ', cz: 'SPRÁVA' },
  'nav.system': { en: 'SYSTEM', ru: 'СИСТЕМА', cz: 'SYSTÉM' },
  
  'settings.title': { en: 'Settings', ru: 'Настройки', cz: 'Nastavení' },
  'settings.subtitle': { en: 'Manage your account preferences', ru: 'Управляйте настройками аккаунта', cz: 'Spravujte nastavení účtu' },
  'settings.language': { en: 'Language', ru: 'Язык', cz: 'Jazyk' },
  'settings.language_description': { en: 'Select your preferred language for the interface', ru: 'Выберите предпочитаемый язык интерфейса', cz: 'Vyberte preferovaný jazyk rozhraní' },
  'settings.currency': { en: 'Currency', ru: 'Валюта', cz: 'Měna' },
  'settings.currency_description': { en: 'Select the currency for displaying amounts throughout the application', ru: 'Выберите валюту для отображения сумм во всем приложении', cz: 'Vyberte měnu pro zobrazení částek v celé aplikaci' },
  'settings.currency_eur': { en: 'Euro', ru: 'Евро', cz: 'Euro' },
  'settings.currency_usd': { en: 'US Dollar', ru: 'Доллар США', cz: 'Americký dolar' },
  'settings.currency_czk': { en: 'Czech Koruna', ru: 'Чешская крона', cz: 'Česká koruna' },
  'settings.currency_rub': { en: 'Russian Ruble', ru: 'Российский рубль', cz: 'Ruský rubl' },
  'settings.currency_uah': { en: 'Ukrainian Hryvnia', ru: 'Украинская гривна', cz: 'Ukrajinská hřivna' },
  'settings.saving': { en: 'Saving...', ru: 'Сохранение...', cz: 'Ukládání...' },
  'settings.saved': { en: 'Settings saved successfully', ru: 'Настройки успешно сохранены', cz: 'Nastavení úspěšně uloženo' },
  'settings.error_saving': { en: 'Error saving settings', ru: 'Ошибка при сохранении настроек', cz: 'Chyba při ukládání nastavení' },
  'settings.theme': { en: 'Theme', ru: 'Тема оформления', cz: 'Téma' },
  'settings.theme_description': { en: 'Select the appearance theme', ru: 'Выберите тему оформления', cz: 'Vyberte téma vzhledu' },
  'settings.theme_light': { en: 'Light', ru: 'Светлая', cz: 'Světlá' },
  'settings.theme_dark': { en: 'Dark', ru: 'Тёмная', cz: 'Tmavá' },
  'settings.theme_system': { en: 'System', ru: 'Системная', cz: 'Systémová' },
  'settings.timezone': { en: 'Timezone', ru: 'Часовой пояс', cz: 'Časové pásmo' },
  'settings.timezone_description': { en: 'Select your timezone for displaying dates and times', ru: 'Выберите часовой пояс для отображения дат и времени', cz: 'Vyberte časové pásmo pro zobrazení dat a času' },
  'settings.date_time_format': { en: 'Date and Time Format', ru: 'Формат даты и времени', cz: 'Formát data a času' },
  'settings.date_format': { en: 'Date Format', ru: 'Формат даты', cz: 'Formát data' },
  'settings.time_format': { en: 'Time Format', ru: 'Формат времени', cz: 'Formát času' },
  'settings.notifications': { en: 'Notifications', ru: 'Уведомления', cz: 'Oznámení' },
  'settings.email_notifications': { en: 'Email Notifications', ru: 'Email уведомления', cz: 'E-mailová oznámení' },
  'settings.email_notifications_description': { en: 'Receive notifications via email', ru: 'Получать уведомления по электронной почте', cz: 'Přijímat oznámení e-mailem' },
  'settings.push_notifications': { en: 'Push Notifications', ru: 'Push уведомления', cz: 'Push oznámení' },
  'settings.push_notifications_description': { en: 'Receive push notifications in browser', ru: 'Получать push уведомления в браузере', cz: 'Přijímat push oznámení v prohlížeči' },
  'settings.auto_save': { en: 'Auto-save', ru: 'Автосохранение', cz: 'Automatické ukládání' },
  'settings.auto_save_enabled': { en: 'Enable Auto-save', ru: 'Включить автосохранение', cz: 'Povolit automatické ukládání' },
  'settings.auto_save_description': { en: 'Automatically save form data while editing', ru: 'Автоматически сохранять данные форм при редактировании', cz: 'Automaticky ukládat data formulářů při úpravách' },
  'settings.auto_save_interval': { en: 'Auto-save Interval', ru: 'Интервал автосохранения', cz: 'Interval automatického ukládání' },
  'settings.seconds': { en: 'seconds', ru: 'секунд', cz: 'sekund' },
  'settings.export_format': { en: 'Export Format', ru: 'Формат экспорта', cz: 'Formát exportu' },
  'settings.export_format_description': { en: 'Default format for exporting data', ru: 'Формат по умолчанию для экспорта данных', cz: 'Výchozí formát pro export dat' },
  
  'inventory.title': { en: 'Inventory Management', ru: 'Управление складом', cz: 'Správa skladu' },
  'inventory.add_product': { en: 'Add Product', ru: 'Добавить товар', cz: 'Přidat produkt' },
  'inventory.edit_product': { en: 'Edit Product', ru: 'Редактировать товар', cz: 'Upravit produkt' },
  'inventory.name': { en: 'Name', ru: 'Название', cz: 'Název' },
  'inventory.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'inventory.category': { en: 'Category', ru: 'Категория', cz: 'Kategorie' },
  'inventory.quantity': { en: 'Quantity', ru: 'Количество', cz: 'Množství' },
  'inventory.min_quantity': { en: 'Min Quantity', ru: 'Мин. количество', cz: 'Min. množství' },
  'inventory.unit': { en: 'Unit', ru: 'Единица', cz: 'Jednotka' },
  'inventory.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'inventory.barcode': { en: 'Barcode', ru: 'Штрихкод', cz: 'Čárový kód' },
  'inventory.supplier': { en: 'Supplier', ru: 'Поставщик', cz: 'Dodavatel' },
  'inventory.location': { en: 'Location', ru: 'Место хранения', cz: 'Umístění' },
  'inventory.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'inventory.edit': { en: 'Edit', ru: 'Редактировать', cz: 'Upravit' },
  'inventory.confirm_delete': { en: 'Are you sure you want to delete this product?', ru: 'Вы уверены, что хотите удалить этот товар?', cz: 'Opravdu chcete smazat tento produkt?' },
  'inventory.delete': { en: 'Delete', ru: 'Удалить', cz: 'Smazat' },
  'inventory.add_quantity': { en: 'Add Quantity', ru: 'Добавить количество', cz: 'Přidat množství' },
  'inventory.add_quantity_to': { en: 'Add Quantity to', ru: 'Добавить количество в', cz: 'Přidat množství do' },
  'inventory.low_stock': { en: 'Low Stock', ru: 'Низкий остаток', cz: 'Nízký stav' },
  'inventory.low_stock_warning': { en: 'Low Stock Warning: {count} product(s) need restocking', ru: 'Предупреждение: {count} товар(ов) нуждается в пополнении', cz: 'Varování: {count} produktů potřebuje doplnění' },
  'inventory.low_stock_description': { en: 'Some products are running low. Please restock to avoid shortages.', ru: 'Некоторые товары заканчиваются. Пожалуйста, пополните склад.', cz: 'Některé produkty docházejí. Prosím doplňte sklad.' },
  'inventory.low_stock_only': { en: 'Low Stock Only', ru: 'Только низкий остаток', cz: 'Pouze nízký stav' },
  'inventory.search_placeholder': { en: 'Search products...', ru: 'Поиск товаров...', cz: 'Hledat produkty...' },
  'inventory.no_products': { en: 'No products found', ru: 'Товары не найдены', cz: 'Produkty nenalezeny' },
  
  'analytics.title': { en: 'Analytics', ru: 'Аналитика', cz: 'Analytika' },
  'analytics.subtitle': { en: 'Advanced analytics and insights for your business', ru: 'Расширенная аналитика и инсайты для вашего бизнеса', cz: 'Pokročilá analytika a poznatky pro váš podnik' },
  'analytics.retention': { en: 'Retention', ru: 'Удержание', cz: 'Retence' },
  'analytics.cohorts': { en: 'Cohorts', ru: 'Когорты', cz: 'Kohorty' },
  'analytics.trends': { en: 'Trends', ru: 'Тренды', cz: 'Trendy' },
  'analytics.forecast': { en: 'Forecast', ru: 'Прогноз', cz: 'Předpověď' },
  'analytics.services_specialists': { en: 'Services & Specialists', ru: 'Услуги и мастера', cz: 'Služby a specialisté' },
  'analytics.insights': { en: 'Insights', ru: 'Инсайты', cz: 'Poznatky' },
  'analytics.benchmarks': { en: 'Benchmarks', ru: 'Бенчмарки', cz: 'Srovnávací hodnoty' },
  'analytics.retention_7_days': { en: '7-Day Retention', ru: 'Удержание за 7 дней', cz: '7denní retence' },
  'analytics.retention_30_days': { en: '30-Day Retention', ru: 'Удержание за 30 дней', cz: '30denní retence' },
  'analytics.retention_90_days': { en: '90-Day Retention', ru: 'Удержание за 90 дней', cz: '90denní retence' },
  'analytics.repeat_rate': { en: 'Repeat Rate', ru: 'Процент повторных клиентов', cz: 'Míra opakování' },
  'analytics.avg_days_between_visits': { en: 'Avg Days Between Visits', ru: 'Среднее дней между визитами', cz: 'Průměr dní mezi návštěvami' },
  'analytics.total_clients': { en: 'Total Clients', ru: 'Всего клиентов', cz: 'Celkem klientů' },
  'analytics.repeat_clients': { en: 'Repeat Clients', ru: 'Повторные клиенты', cz: 'Opakující se klienti' },
  'analytics.cohort_month': { en: 'Cohort Month', ru: 'Месяц когорты', cz: 'Měsíc kohorty' },
  'analytics.trend_metric': { en: 'Metric', ru: 'Метрика', cz: 'Metrika' },
  'analytics.trend_comparison': { en: 'Comparison', ru: 'Сравнение', cz: 'Porovnání' },
  'analytics.current_value': { en: 'Current', ru: 'Текущее', cz: 'Aktuální' },
  'analytics.previous_value': { en: 'Previous', ru: 'Предыдущее', cz: 'Předchozí' },
  'analytics.change': { en: 'Change', ru: 'Изменение', cz: 'Změna' },
  'analytics.change_percent': { en: 'Change %', ru: 'Изменение %', cz: 'Změna %' },
  'analytics.trend_up': { en: 'Up', ru: 'Вверх', cz: 'Nahoru' },
  'analytics.trend_down': { en: 'Down', ru: 'Вниз', cz: 'Dolů' },
  'analytics.trend_stable': { en: 'Stable', ru: 'Стабильно', cz: 'Stabilní' },
  'analytics.forecast_type': { en: 'Forecast Type', ru: 'Тип прогноза', cz: 'Typ předpovědi' },
  'analytics.forecast_periods': { en: 'Periods', ru: 'Периоды', cz: 'Období' },
  'analytics.historical_average': { en: 'Historical Average', ru: 'Историческое среднее', cz: 'Historický průměr' },
  'analytics.last_value': { en: 'Last Value', ru: 'Последнее значение', cz: 'Poslední hodnota' },
  'analytics.service_name': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'analytics.visit_count': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'analytics.total_revenue': { en: 'Total Revenue', ru: 'Общая выручка', cz: 'Celkový příjem' },
  'analytics.avg_price': { en: 'Avg Price', ru: 'Средняя цена', cz: 'Průměrná cena' },
  'analytics.unique_clients': { en: 'Unique Clients', ru: 'Уникальные клиенты', cz: 'Unikátní klienti' },
  'analytics.ltv_per_client': { en: 'LTV per Client', ru: 'LTV на клиента', cz: 'LTV na klienta' },
  'analytics.visits_per_client': { en: 'Visits per Client', ru: 'Визиты на клиента', cz: 'Návštěvy na klienta' },
  'analytics.specialist_name': { en: 'Specialist', ru: 'Мастер', cz: 'Specialista' },
  'analytics.avg_check': { en: 'Avg Check', ru: 'Средний чек', cz: 'Průměrný šek' },
  'analytics.revenue_per_client': { en: 'Revenue per Client', ru: 'Выручка на клиента', cz: 'Příjem na klienta' },
  'analytics.insight_type_info': { en: 'Info', ru: 'Информация', cz: 'Informace' },
  'analytics.insight_type_warning': { en: 'Warning', ru: 'Предупреждение', cz: 'Varování' },
  'analytics.insight_type_success': { en: 'Success', ru: 'Успех', cz: 'Úspěch' },
  'analytics.insight_priority_low': { en: 'Low', ru: 'Низкий', cz: 'Nízký' },
  'analytics.insight_priority_medium': { en: 'Medium', ru: 'Средний', cz: 'Střední' },
  'analytics.insight_priority_high': { en: 'High', ru: 'Высокий', cz: 'Vysoký' },
  'analytics.benchmarks_available': { en: 'Benchmarks Available', ru: 'Бенчмарки доступны', cz: 'Srovnávací hodnoty dostupné' },
  'analytics.benchmarks_not_available': { en: 'Not enough data for benchmarks', ru: 'Недостаточно данных для бенчмарков', cz: 'Nedostatek dat pro srovnávací hodnoty' },
  'analytics.business_count': { en: 'Businesses Analyzed', ru: 'Бизнесов проанализировано', cz: 'Analyzovaných podniků' },
  'analytics.avg_check_benchmark': { en: 'Avg Check', ru: 'Средний чек', cz: 'Průměrný šek' },
  'analytics.avg_visits_per_client': { en: 'Avg Visits per Client', ru: 'Среднее визитов на клиента', cz: 'Průměr návštěv na klienta' },
  'analytics.avg_retention_rate': { en: 'Avg Retention Rate', ru: 'Средняя удерживаемость', cz: 'Průměrná retence' },
  'analytics.avg_daily_load': { en: 'Avg Daily Load', ru: 'Средняя дневная загрузка', cz: 'Průměrné denní zatížení' },
  'analytics.no_data': { en: 'No data available', ru: 'Нет данных', cz: 'Žádná data' },
  'analytics.loading': { en: 'Loading...', ru: 'Загрузка...', cz: 'Načítání...' },
  'analytics.date_from': { en: 'Date From', ru: 'Дата от', cz: 'Datum od' },
  'analytics.date_to': { en: 'Date To', ru: 'Дата до', cz: 'Datum do' },
  'analytics.metric_revenue': { en: 'Revenue', ru: 'Выручка', cz: 'Příjem' },
  'analytics.metric_clients': { en: 'Clients', ru: 'Клиенты', cz: 'Klienti' },
  'analytics.metric_visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'analytics.metric_average_check': { en: 'Average Check', ru: 'Средний чек', cz: 'Průměrný šek' },
  'analytics.metric_load': { en: 'Load', ru: 'Загрузка', cz: 'Zatížení' },
  'analytics.comparison_mom': { en: 'Month over Month', ru: 'Месяц к месяцу', cz: 'Měsíc k měsíci' },
  'analytics.comparison_wow': { en: 'Week over Week', ru: 'Неделя к неделе', cz: 'Týden k týdnu' },
  'analytics.comparison_yoy': { en: 'Year over Year', ru: 'Год к году', cz: 'Rok k roku' },
  'analytics.forecast_revenue': { en: 'Revenue', ru: 'Выручка', cz: 'Příjem' },
  'analytics.forecast_visits': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  
  'finance.title': { en: 'Financial Reports', ru: 'Финансовая отчетность', cz: 'Finanční zprávy' },
  'finance.subtitle': { en: 'Revenue, expenses, and profit analysis', ru: 'Анализ доходов, расходов и прибыли', cz: 'Analýza příjmů, výdajů a zisku' },
  'finance.revenue': { en: 'Revenue', ru: 'Доходы', cz: 'Příjmy' },
  'finance.expenses': { en: 'Expenses', ru: 'Расходы', cz: 'Výdaje' },
  'finance.profit': { en: 'Profit', ru: 'Прибыль', cz: 'Zisk' },
  'finance.profit_margin': { en: 'Profit Margin', ru: 'Рентабельность', cz: 'Zisková marže' },
  'finance.date_from': { en: 'Date From', ru: 'Дата от', cz: 'Datum od' },
  'finance.date_to': { en: 'Date To', ru: 'Дата до', cz: 'Datum do' },
  'finance.category': { en: 'Category', ru: 'Категория', cz: 'Kategorie' },
  'finance.all_categories': { en: 'All Categories', ru: 'Все категории', cz: 'Všechny kategorie' },
  'finance.add_expense': { en: 'Add Expense', ru: 'Добавить расход', cz: 'Přidat výdaj' },
  'finance.expenses_by_category': { en: 'Expenses by Category', ru: 'Расходы по категориям', cz: 'Výdaje podle kategorií' },
  'finance.expenses_list': { en: 'Expenses List', ru: 'Список расходов', cz: 'Seznam výdajů' },
  'finance.no_expenses': { en: 'No expenses found', ru: 'Расходы не найдены', cz: 'Výdaje nenalezeny' },
  'finance.date': { en: 'Date', ru: 'Дата', cz: 'Datum' },
  'finance.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'finance.amount': { en: 'Amount', ru: 'Сумма', cz: 'Částka' },
  'finance.payment_method': { en: 'Payment Method', ru: 'Способ оплаты', cz: 'Způsob platby' },
  'finance.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'finance.confirm_delete': { en: 'Are you sure you want to delete this expense?', ru: 'Вы уверены, что хотите удалить этот расход?', cz: 'Opravdu chcete smazat tento výdaj?' },
  'finance.form_coming_soon': { en: 'Expense form is coming soon', ru: 'Форма добавления расхода скоро появится', cz: 'Formulář pro přidání výdaje brzy přijde' },
  'finance.currency': { en: 'Currency', ru: 'Валюта', cz: 'Měna' },
  'finance.no_category': { en: 'No Category', ru: 'Без категории', cz: 'Bez kategorie' },
  'finance.amount_required': { en: 'Amount is required and must be greater than 0', ru: 'Сумма обязательна и должна быть больше 0', cz: 'Částka je povinná a musí být větší než 0' },
  'finance.date_required': { en: 'Date is required', ru: 'Дата обязательна', cz: 'Datum je povinné' },
  'finance.description_placeholder': { en: 'Enter expense description (optional)', ru: 'Введите описание расхода (необязательно)', cz: 'Zadejte popis výdaje (volitelné)' },
  'finance.payment_cash': { en: 'Cash', ru: 'Наличные', cz: 'Hotovost' },
  'finance.payment_card': { en: 'Card', ru: 'Карта', cz: 'Karta' },
  'finance.payment_transfer': { en: 'Bank Transfer', ru: 'Банковский перевод', cz: 'Bankovní převod' },
  'finance.payment_other': { en: 'Other', ru: 'Прочее', cz: 'Jiné' },
  'finance.payments_volume': { en: 'Payments volume', ru: 'Объем платежей', cz: 'Objem plateb' },
  'finance.completed': { en: 'completed', ru: 'завершено', cz: 'dokončeno' },
  'finance.total': { en: 'Total', ru: 'Итого', cz: 'Celkem' },
  
  'subscription.title': { en: 'Subscription Management', ru: 'Управление подпиской', cz: 'Správa předplatného' },
  'trial.banner_active': { en: 'Trial period: {days} days remaining (until {date})', ru: 'Пробный период: осталось {days} дн. (до {date})', cz: 'Zkušební období: zbývá {days} dní (do {date})' },
  'trial.banner_cta': { en: 'Choose Plan', ru: 'Выбрать тариф', cz: 'Vybrat tarif' },
  'trial.banner_expired': { en: 'Trial ended. Your salon data is preserved. Choose a plan to continue.', ru: 'Пробный период завершён. Ваши данные сохранены. Выберите тариф для продолжения.', cz: 'Zkušební období skončilo. Vaše data jsou uložena. Vyberte tarif pro pokračování.' },
  'subscription.usage_title': { en: 'Plan Usage and Entitlements', ru: 'Использование тарифа и лимиты', cz: 'Využití tarifu a limity' },
  'subscription.crm_usage': {"en": "CRM: Visits this month", "ru": "CRM: визиты за месяц", "cz": "CRM: návštěvy tento měsíc"},
  'subscription.ai_usage': { en: 'AI Sasha: Daily Requests', ru: 'ИИ Сашенька: запросы за сегодня', cz: 'AI Sašenka: dnešní dotazy' },
  'subscription.within_limit': { en: 'Within limit', ru: 'В пределах тарифа', cz: 'V rámci limitu' },
  'subscription.limit_exceeded': { en: 'Limit reached', ru: 'Лимит исчерпан', cz: 'Limit vyčerpán' },
  'subscription.notRequired': { en: 'Subscription is not required for your role', ru: 'Подписка не требуется для вашей роли', cz: 'Předplatné není vyžadováno pro vaši roli' },
  'subscription.currentSubscription': { en: 'Current Subscription', ru: 'Текущая подписка', cz: 'Aktuální předplatné' },
  'subscription.trialActive': { en: 'Trial period is active', ru: 'Пробный период активен', cz: 'Zkušební období je aktivní' },
  'subscription.trialEnds': { en: 'Trial ends', ru: 'Пробный период заканчивается', cz: 'Zkušební období končí' },
  'subscription.availablePlans': { en: 'Available Plans', ru: 'Доступные планы', cz: 'Dostupné plány' },
  'subscription.currentPlan': { en: 'Current Plan', ru: 'Текущий план', cz: 'Aktuální plán' },
  'subscription.subscribe': { en: 'Subscribe', ru: 'Подписаться', cz: 'Přihlásit se' },
  'subscription.noSubscription': { en: 'No active subscription', ru: 'Нет активной подписки', cz: 'Žádné aktivní předplatné' },
  'subscription.selectPlan': { en: 'Please select a plan above to subscribe', ru: 'Пожалуйста, выберите план выше для подписки', cz: 'Vyberte prosím plán výše pro předplatné' },
  'subscription.noPlansAvailable': { en: 'No subscription plans available for your role', ru: 'Нет доступных планов для вашей роли', cz: 'Žádné dostupné plány pro vaši roli' },
  'subscription.contactAdmin': { en: 'Please contact administrator to create subscription plans', ru: 'Обратитесь к администратору для создания планов подписки', cz: 'Kontaktujte správce pro vytvoření plánů předplatného' },
  'subscription.cancel': { en: 'Cancel Subscription', ru: 'Отменить подписку', cz: 'Zrušit předplatné' },
  'subscription.cancelled': { en: 'Cancelled', ru: 'Отменена', cz: 'Zrušeno' },
  'subscription.reactivate': { en: 'Reactivate', ru: 'Возобновить', cz: 'Obnovit' },
  'subscription.pendingCancellation': { en: 'Pending Cancellation', ru: 'Ожидает отмены', cz: 'Čeká na zrušení' },
  'subscription.transactionHistory': { en: 'Transaction History', ru: 'История транзакций', cz: 'Historie transakcí' },
  'subscription.history': { en: 'Subscription History', ru: 'История подписок', cz: 'Historie předplatného' },
  'subscription.status_label': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'subscription.status.active': { en: 'Active', ru: 'Активна', cz: 'Aktivní' },
  'subscription.status.cancelled': { en: 'Cancelled', ru: 'Отменена', cz: 'Zrušeno' },
  'subscription.status.expired': { en: 'Expired', ru: 'Истекла', cz: 'Vypršelo' },
  'subscription.status.past_due': { en: 'Payment overdue', ru: 'Платёж просрочен', cz: 'Platba po splatnosti' },
  'subscription.transaction.succeeded': { en: 'Paid', ru: 'Оплачено', cz: 'Vyplaceno' },
  'subscription.transaction.pending': { en: 'Pending', ru: 'В обработке', cz: 'Zpracovává se' },
  'subscription.transaction.failed': { en: 'Failed', ru: 'Не прошёл', cz: 'Selhalo' },
  'subscription.transaction.refunded': { en: 'Refunded', ru: 'Возвращён', cz: 'Vráceno' },
  'subscription.checkoutCancelled': { en: "Checkout was cancelled. You can choose a plan again.", ru: "Оплата отменена. Можно снова выбрать тариф.", cz: "Platba byla zrušena. Můžete znovu vybrat tarif." },
  'subscription.checkoutVerifyError': { en: "Could not verify the payment. Please try again.", ru: "Не удалось проверить оплату. Попробуйте ещё раз.", cz: "Platbu se nepodařilo ověřit. Zkuste to znovu." },
  'subscription.checkoutActive': { en: "Your paid subscription is active.", ru: "Оплаченная подписка активна.", cz: "Vaše placené předplatné je aktivní." },
  'subscription.checkoutPending': { en: "Payment received. Waiting for subscription activation…", ru: "Оплата получена. Ожидаем активации подписки…", cz: "Platba přijata. Čekáme na aktivaci předplatného…" },
  'subscription.checkoutUnpaid': { en: "Payment has not been completed.", ru: "Оплата ещё не завершена.", cz: "Platba ještě nebyla dokončena." },
  'subscription.checkoutChecking': { en: "Checking payment…", ru: "Проверяем оплату…", cz: "Ověřujeme platbu…" },
  'subscription.checkoutRetry': { en: "Check again", ru: "Проверить ещё раз", cz: "Zkontrolovat znovu" },
  'subscription.checkoutUnavailable': { en: 'Online payment is not available right now, please try again later', ru: 'Онлайн-оплата сейчас недоступна, попробуйте позже', cz: 'Online platba teď není dostupná, zkuste to prosím později' },
  'subscription.cancellation_date': { en: 'Cancellation Date', ru: 'Дата отмены', cz: 'Datum zrušení' },
  'subscription.days_remaining': { en: 'days remaining', ru: 'дней осталось', cz: 'dní zbývá' },
  'subscription.trial_period': { en: 'Trial Period', ru: 'Пробный период', cz: 'Zkušební období' },
  'subscription.trial_period_active': { en: 'Active', ru: 'Активен', cz: 'Aktivní' },
  'subscription.period_ends': { en: 'Period Ends', ru: 'Период заканчивается', cz: 'Období končí' },
  'subscription.per_month': { en: '/ month', ru: ' / месяц', cz: ' / měsíc' },
  'subscription.per_year': { en: '/ year', ru: ' / год', cz: ' / rok' },
  'subscription.period_days': { en: 'Period', ru: 'Период', cz: 'Období' },
  'subscription.plan_label': { en: 'Plan', ru: 'План', cz: 'Plán' },
  'subscription.created_label': { en: 'Created', ru: 'Создано', cz: 'Vytvořeno' },
  'subscription.period_end_label': { en: 'Period End', ru: 'Конец периода', cz: 'Konec období' },
  'subscription.plan_number': { en: 'Plan', ru: 'План', cz: 'Plán' },
  'subscription.failed_subscribe': { en: 'Failed to subscribe', ru: 'Не удалось подписаться', cz: 'Nepodařilo se přihlásit' },
  'subscription.failed_cancel': { en: 'Failed to cancel subscription', ru: 'Не удалось отменить подписку', cz: 'Nepodařilo se zrušit předplatné' },
  'subscription.failed_reactivate': { en: 'Failed to reactivate subscription', ru: 'Не удалось возобновить подписку', cz: 'Nepodařilo se obnovit předplatné' },
  'subscription.active_label': { en: 'Active', ru: 'Активен', cz: 'Aktivní' },
  
  'loyalty.title': { en: 'Loyalty Program', ru: 'Программа лояльности', cz: 'Věrnostní program' },
  'loyalty.subtitle': { en: 'Manage loyalty program, levels, and promotions', ru: 'Управление программой лояльности, уровнями и акциями', cz: 'Správa věrnostního programu, úrovní a akcí' },
  'loyalty.program_settings': { en: 'Program Settings', ru: 'Настройки программы', cz: 'Nastavení programu' },
  'loyalty.levels': { en: 'Loyalty Levels', ru: 'Уровни лояльности', cz: 'Úrovně věrnosti' },
  'loyalty.promotions': { en: 'Promotions', ru: 'Акции', cz: 'Akce' },
  'loyalty.transactions': { en: 'Transactions', ru: 'Транзакции', cz: 'Transakce' },
  'loyalty.program_type': { en: 'Program Type', ru: 'Тип программы', cz: 'Typ programu' },
  'loyalty.program_points': { en: 'Points', ru: 'Баллы', cz: 'Body' },
  'loyalty.program_cashback': { en: 'Cashback', ru: 'Кэшбэк', cz: 'Cashback' },
  'loyalty.program_hybrid': { en: 'Hybrid (Points + Cashback)', ru: 'Гибрид (Баллы + Кэшбэк)', cz: 'Hybrid (Body + Cashback)' },
  'loyalty.points_per_currency': { en: 'Points per Currency Unit', ru: 'Баллов за единицу валюты', cz: 'Bodů za jednotku měny' },
  'loyalty.points_name': { en: 'Points Name', ru: 'Название баллов', cz: 'Název bodů' },
  'loyalty.currency_per_point': { en: 'Currency per Point', ru: 'Валюта за балл', cz: 'Měna za bod' },
  'loyalty.cashback_percent': { en: 'Cashback Percentage', ru: 'Процент кэшбэка', cz: 'Procento cashbacku' },
  'loyalty.use_levels': { en: 'Use Levels', ru: 'Использовать уровни', cz: 'Použít úrovně' },
  'loyalty.points_expiry_days': { en: 'Points Expiry (days)', ru: 'Срок действия баллов (дней)', cz: 'Platnost bodů (dny)' },
  'loyalty.birthday_bonus_enabled': { en: 'Enable Birthday Bonus', ru: 'Включить бонус ко дню рождения', cz: 'Povolit narozeninový bonus' },
  'loyalty.birthday_bonus_points': { en: 'Birthday Bonus Points', ru: 'Бонусные баллы ко дню рождения', cz: 'Narozeninové bonusové body' },
  'loyalty.birthday_bonus_percent': { en: 'Birthday Bonus Cashback %', ru: 'Бонусный кэшбэк ко дню рождения %', cz: 'Narozeninový cashback %' },
  'loyalty.max_bonus_payment_percent': { en: 'Max Bonus Payment %', ru: 'Макс. % оплаты бонусами', cz: 'Max. % platby bonusy' },
  'loyalty.is_active': { en: 'Active', ru: 'Активна', cz: 'Aktivní' },
  'loyalty.create_program': { en: 'Create Program', ru: 'Создать программу', cz: 'Vytvořit program' },
  'loyalty.edit_program': { en: 'Edit Program', ru: 'Редактировать программу', cz: 'Upravit program' },
  'loyalty.delete_program': { en: 'Delete Program', ru: 'Удалить программу', cz: 'Smazat program' },
  'loyalty.add_level': { en: 'Add Level', ru: 'Добавить уровень', cz: 'Přidat úroveň' },
  'loyalty.edit_level': { en: 'Edit Level', ru: 'Редактировать уровень', cz: 'Upravit úroveň' },
  'loyalty.level_name': { en: 'Level Name', ru: 'Название уровня', cz: 'Název úrovně' },
  'loyalty.level_number': { en: 'Level Number', ru: 'Номер уровня', cz: 'Číslo úrovně' },
  'loyalty.min_spending': { en: 'Minimum Spending', ru: 'Минимальные траты', cz: 'Minimální výdaje' },
  'loyalty.points_multiplier': { en: 'Points Multiplier', ru: 'Множитель баллов', cz: 'Násobitel bodů' },
  'loyalty.cashback_multiplier': { en: 'Cashback Multiplier', ru: 'Множитель кэшбэка', cz: 'Násobitel cashbacku' },
  'loyalty.benefits': { en: 'Benefits', ru: 'Привилегии', cz: 'Výhody' },
  'loyalty.color': { en: 'Color', ru: 'Цвет', cz: 'Barva' },
  'loyalty.add_promotion': { en: 'Add Promotion', ru: 'Добавить акцию', cz: 'Přidat akci' },
  'loyalty.edit_promotion': { en: 'Edit Promotion', ru: 'Редактировать акцию', cz: 'Upravit akci' },
  'loyalty.promotion_name': { en: 'Promotion Name', ru: 'Название акции', cz: 'Název akce' },
  'loyalty.promotion_type': { en: 'Promotion Type', ru: 'Тип акции', cz: 'Typ akce' },
  'loyalty.promotion_double_points': { en: 'Double Points', ru: 'Двойные баллы', cz: 'Dvojité body' },
  'loyalty.promotion_extra_cashback': { en: 'Extra Cashback', ru: 'Дополнительный кэшбэк', cz: 'Extra cashback' },
  'loyalty.promotion_bonus_points': { en: 'Bonus Points', ru: 'Бонусные баллы', cz: 'Bonusové body' },
  'loyalty.promotion_discount': { en: 'Discount', ru: 'Скидка', cz: 'Sleva' },
  'loyalty.bonus_points': { en: 'Bonus Points', ru: 'Бонусные баллы', cz: 'Bonusové body' },
  'loyalty.discount_percent': { en: 'Discount %', ru: 'Скидка %', cz: 'Sleva %' },
  'loyalty.start_date': { en: 'Start Date', ru: 'Дата начала', cz: 'Datum začátku' },
  'loyalty.end_date': { en: 'End Date', ru: 'Дата окончания', cz: 'Datum konce' },
  'loyalty.min_amount': { en: 'Minimum Amount', ru: 'Минимальная сумма', cz: 'Minimální částka' },
  'loyalty.for_all_clients': { en: 'For All Clients', ru: 'Для всех клиентов', cz: 'Pro všechny klienty' },
  'loyalty.for_specific_client': { en: 'For Specific Client', ru: 'Для конкретного клиента', cz: 'Pro konkrétního klienta' },
  'loyalty.client_balance': { en: 'Client Balance', ru: 'Баланс клиента', cz: 'Zůstatek klienta' },
  'loyalty.points': { en: 'Points', ru: 'Баллы', cz: 'Body' },
  'loyalty.cashback': { en: 'Cashback', ru: 'Кэшбэк', cz: 'Cashback' },
  'loyalty.current_level': { en: 'Current Level', ru: 'Текущий уровень', cz: 'Aktuální úroveň' },
  'loyalty.transaction_history': { en: 'Transaction History', ru: 'История транзакций', cz: 'Historie transakcí' },
  'loyalty.transaction_type': { en: 'Type', ru: 'Тип', cz: 'Typ' },
  'loyalty.transaction_earned': { en: 'Earned', ru: 'Начислено', cz: 'Získáno' },
  'loyalty.transaction_spent': { en: 'Spent', ru: 'Потрачено', cz: 'Utráceno' },
  'loyalty.transaction_birthday': { en: 'Birthday Bonus', ru: 'Бонус ко дню рождения', cz: 'Narozeninový bonus' },
  'loyalty.transaction_level_up': { en: 'Level Up', ru: 'Повышение уровня', cz: 'Povýšení úrovně' },
  'loyalty.use_points': { en: 'Use Points', ru: 'Использовать баллы', cz: 'Použít body' },
  'loyalty.points_to_use': { en: 'Points to Use', ru: 'Баллов к использованию', cz: 'Body k použití' },
  'loyalty.cashback_to_use': { en: 'Cashback to Use', ru: 'Кэшбэк к использованию', cz: 'Cashback k použití' },
  'loyalty.discount_amount': { en: 'Discount Amount', ru: 'Сумма скидки', cz: 'Výše slevy' },
  'loyalty.no_program': { en: 'No loyalty program created', ru: 'Программа лояльности не создана', cz: 'Věrnostní program není vytvořen' },
  'loyalty.program_not_active': { en: 'Program is not active', ru: 'Программа не активна', cz: 'Program není aktivní' },
  'loyalty.activate_program': { en: 'Activate Program', ru: 'Активировать программу', cz: 'Aktivovat program' },
  'loyalty.deactivate_program': { en: 'Deactivate Program', ru: 'Деактивировать программу', cz: 'Deaktivovat program' },
  'loyalty.no_levels': { en: 'No levels created', ru: 'Уровни не созданы', cz: 'Úrovně nejsou vytvořeny' },
  'loyalty.no_promotions': { en: 'No promotions', ru: 'Акций нет', cz: 'Žádné akce' },
  'loyalty.no_transactions': { en: 'No transactions', ru: 'Транзакций нет', cz: 'Žádné transakce' },
  'loyalty.service_ids': { en: 'Service IDs (comma-separated)', ru: 'ID услуг (через запятую)', cz: 'ID služeb (oddělené čárkou)' },
  'loyalty.service_ids_placeholder': { en: 'e.g., 1, 2, 3 (leave empty for all services)', ru: 'например, 1, 2, 3 (оставьте пустым для всех услуг)', cz: 'např. 1, 2, 3 (ponechte prázdné pro všechny služby)' },
  
  'common.currency': { en: 'CZK', ru: 'CZK', cz: 'CZK' },
  'common.close': { en: 'Close', ru: 'Закрыть', cz: 'Zavřít' },
  'common.days': { en: 'days', ru: 'дней', cz: 'dny' },
  'common.actions': { en: 'Actions', ru: 'Действия', cz: 'Akce' },
  'common.required_field': { en: 'is a required field', ru: 'обязательное поле', cz: 'je povinné pole' },
  'common.error_saving': { en: 'Error saving', ru: 'Ошибка при сохранении', cz: 'Chyba při ukládání' },
  'common.loadError': { en: 'Unable to load data', ru: 'Не удалось загрузить данные', cz: 'Data se nepodařilo načíst' },
  'common.retry': { en: 'Retry', ru: 'Повторить', cz: 'Zkusit znovu' },
  'common.offline': { en: 'No internet connection', ru: 'Нет подключения к сети', cz: 'Bez připojení k internetu' },

  'landing.hero.title': {
    en: 'Smart CRM & AI Assistant for Salons and Masters',
    ru: 'Умная CRM и AI-ассистент для салонов и мастеров',
    cz: 'Chytré CRM a AI asistent pro salony a mistry',
  },
  'landing.hero.subtitle': {
    en: 'Streamline client booking, schedules, analytics, and assistant tasks in one clean workspace.',
    ru: 'Онлайн-запись, расписание мастеров, клиентская база и ассистент Сашенька в едином рабочем пространстве.',
    cz: 'Online rezervace, rozvrh mistrů, klientská databáze a asistentka v jednom pracovním prostoru.',
  },
  'landing.hero.badge': {
    en: 'All-in-one workspace for beauty businesses',
    ru: 'Единая платформа для бьюти-бизнеса',
    cz: 'Jednotná platforma pro beauty podnikání',
  },
  'landing.hero.cta_start': {
    en: 'Try for free',
    ru: 'Попробовать бесплатно',
    cz: 'Vyzkoušet zdarma',
  },
  'landing.hero.cta_login': {
    en: 'Log in',
    ru: 'Войти',
    cz: 'Přihlásit se',
  },
  'landing.hero.cta_app': {
    en: 'Open CRM',
    ru: 'Открыть CRM',
    cz: 'Otevřít CRM',
  },
  'landing.hero.preview_title': {
    en: 'Real-time schedule overview',
    ru: 'Обзор расписания в реальном времени',
    cz: 'Přehled rozvrhu v reálném čase',
  },
  'landing.hero.preview_slot1': {
    en: 'Hair styling & care · Anna · 10:00',
    ru: 'Стрижка и уход · Анна · 10:00',
    cz: 'Střih a péče · Anna · 10:00',
  },
  'landing.hero.preview_slot2': {
    en: 'Manicure · Elena · 11:30',
    ru: 'Маникюр · Елена · 11:30',
    cz: 'Manikúra · Elena · 11:30',
  },

  'landing.features.title': {
    en: 'Everything your salon needs to operate smoothly',
    ru: 'Всё необходимое для чёткой работы салона',
    cz: 'Vše potřebné pro hladký provoz salonu',
  },
  'landing.features.subtitle': {
    en: 'Key tools designed specifically for beauty specialists and salon managers.',
    ru: 'Ключевые инструменты, созданные специально для мастеров красоты и руководителей.',
    cz: 'Klíčové nástroje navržené přímo pro specialisty krásy a vedoucí salonů.',
  },
  'landing.features.booking_title': {
    en: 'Direct Online Booking',
    ru: 'Прямая онлайн-запись',
    cz: 'Přímá online rezervace',
  },
  'landing.features.booking_desc': {
    en: 'Turn on the public booking link in your business settings so clients can pick a service and a free slot.',
    ru: 'Включите публичную ссылку записи в настройках бизнеса — клиенты выберут услугу и свободное время.',
    cz: 'Zapněte veřejný rezervační odkaz v nastavení podniku, aby si klienti vybrali službu a volný termín.',
  },
  'landing.features.calendar_title': {
    en: 'Master Schedule Grid',
    ru: 'Журнал расписания мастеров',
    cz: 'Rozvrh a kalendář mistrů',
  },
  'landing.features.calendar_desc': {
    en: 'Visual day and week views showing appointments, buffers, and specialist shifts.',
    ru: 'Наглядная сетка дня и недели с визитами, перерывами и рабочими сменами специалистов.',
    cz: 'Přehledná mřížka dne a týdne s návštěvami, přestávkami a směnami specialistů.',
  },
  'landing.features.clients_title': {
    en: 'Client History & Profiles',
    ru: 'Клиентская база и история',
    cz: 'Klientská databáze a historie',
  },
  'landing.features.clients_desc': {
    en: 'Keep complete visit history, contact preferences, loyalty balances, and service notes.',
    ru: 'Хранение истории визитов, контактных данных, баланса лояльности и персональных заметок.',
    cz: 'Ukládání historie návštěv, kontaktních údajů, věrnostního zůstatku a poznámek.',
  },
  'landing.features.assistant_title': {
    en: 'AI Assistant Sashenka',
    ru: 'AI-ассистент Сашенька',
    cz: 'AI asistentka Sašenka',
  },
  'landing.features.assistant_desc': {
    en: 'Ask questions about schedule, client history, or routine tasks with natural dialogue.',
    ru: 'Диалог на естественном языке для быстрых справок по расписанию, визитам и задачам.',
    cz: 'Přirozený dialog pro rychlé dotazy na rozvrh, návštěvy a provozní úkoly.',
  },
  'landing.features.analytics_title': {
    en: 'Actionable Analytics',
    ru: 'Понятная аналитика',
    cz: 'Přehledná analytika',
  },
  'landing.features.analytics_desc': {
    en: 'Track revenue, visit dynamics, popular services, and employee productivity.',
    ru: 'Отслеживание выручки, динамики записей, популярных услуг и загрузки сотрудников.',
    cz: 'Sledování tržeb, dynamiky návštěv, oblíbených služeb a vytížení personálu.',
  },
  'landing.features.finance_title': {
    en: 'Finance & Salary Accounting',
    ru: 'Финансы и расчёт зарплат',
    cz: 'Finance a výpočet mezd',
  },
  'landing.features.finance_desc': {
    en: 'Transparent expense tracking, master commission rates, and salary calculation.',
    ru: 'Учёт расходов, прозрачный расчёт комиссий мастеров и заработной платы.',
    cz: 'Evidence výdajů, transparentní výpočet provizí mistrů a mezd.',
  },

  'landing.tour.title': {
    en: 'A closer look at the actual interface',
    ru: 'Реальный интерфейс системы',
    cz: 'Skutečné rozhraní systému',
  },
  'landing.tour.subtitle': {
    en: 'Clean, focused, and responsive — built for high-speed salon operation.',
    ru: 'Лаконичный, быстрый и отзывчивый — создан для удобной повседневной работы.',
    cz: 'Jednoduchý, rychlý a responzivní — vytvořen pro pohodlnou každodenní práci.',
  },
  'landing.tour.calendar_tab': {
    en: 'Calendar & Visits',
    ru: 'Календарь и визиты',
    cz: 'Kalendář a návštěvy',
  },
  'landing.tour.clients_tab': {
    en: 'Clients & Cards',
    ru: 'Клиенты и карточки',
    cz: 'Klienti a karty',
  },
  'landing.tour.assistant_tab': {
    en: 'Assistant Chat',
    ru: 'Чат ассистента',
    cz: 'Chat asistentky',
  },
  'landing.tour.step1_title': {
    en: 'Interactive timetable grid',
    ru: 'Интерактивная сетка расписания',
    cz: 'Interaktivní mřížka rozvrhu',
  },
  'landing.tour.step1_desc': {
    en: 'Instant slot selection, status indicators, and drag-and-drop support.',
    ru: 'Мгновенный выбор свободного времени, статусы визитов и быстрое редактирование.',
    cz: 'Okamžitý výběr volného času, stavy návštěv a rychlá úprava.',
  },
  'landing.tour.step2_title': {
    en: 'Comprehensive client profiles',
    ru: 'Подробная карточка клиента',
    cz: 'Podrobná karta klienta',
  },
  'landing.tour.step2_desc': {
    en: 'Search by phone or name, review past visits, tags, and preferences.',
    ru: 'Быстрый поиск по имени или телефону, история процедур, теги и предпочтения.',
    cz: 'Rychlé hledání podle jména nebo telefonu, historie procedur a preference.',
  },
  'landing.tour.step3_title': {
    en: 'Voice & text assistant dialogs',
    ru: 'Голосовые и текстовые диалоги',
    cz: 'Hlasové a textové dialogy s asistentem',
  },
  'landing.tour.step3_desc': {
    en: 'Get quick answers about today’s schedule without navigating multiple menus.',
    ru: 'Быстрый ответ о расписании на сегодня без долгих поисков по меню.',
    cz: 'Rychlá odpověď o rozvrhu na dnešek bez zdlouhavého hledání v menu.',
  },

  'landing.faq.title': {
    en: 'Frequently Asked Questions',
    ru: 'Часто задаваемые вопросы',
    cz: 'Často kladené otázky',
  },
  'landing.faq.subtitle': {
    en: 'Clear answers about start, trials, pricing, and your salon data.',
    ru: 'Ответы о начале работы, пробном периоде, тарифах и безопасности данных.',
    cz: 'Jasné odpovědi o začátku práce, zkušebním období, tarifech a bezpečnosti dat.',
  },
  'landing.faq.q1': {
    en: 'How does the free trial work?',
    ru: 'Как работает бесплатный пробный период?',
    cz: 'Jak funguje bezplatné zkušební období?',
  },
  'landing.faq.a1': {"en": "New salons and specialists receive 7 days of CRM and AI without a card: up to 300 visits and 50 AI requests per day.", "ru": "Новые салоны и мастера получают 7 дней CRM и ИИ без карты: до 300 визитов и 50 запросов ИИ в день.", "cz": "Nové salony a specialisté získají 7 dní CRM a AI bez karty: až 300 návštěv a 50 požadavků AI denně."},
  'landing.faq.q2': {
    en: 'Can solo specialists use Xtrix without hiring employees?',
    ru: 'Может ли частный специалист работать без сотрудников?',
    cz: 'Může soukromý specialista pracovat bez zaměstnanců?',
  },
  'landing.faq.a2': {
    en: 'Yes, Xtrix is fully adapted for solo practitioners who manage their own bookings, clients, and services.',
    ru: 'Да, Xtrix полностью адаптирован для индивидуальной работы мастера со своими клиентами, услугами и расписанием.',
    cz: 'Ano, Xtrix je plně přizpůsoben pro samostatnou práci mistra s vlastními klienty, službami a rozvrhem.',
  },
  'landing.faq.q3': {
    en: 'How are client data and privacy protected?',
    ru: 'Как защищены данные клиентов и салона?',
    cz: 'Jak jsou chráněna data klientů a salonu?',
  },
  'landing.faq.a3': {"en": "Access to salon records is restricted by business and user role. Medical questionnaires are not included in the pilot.", "ru": "Доступ к записям ограничен салоном и ролью пользователя. Медицинские анкеты в пилот не входят.", "cz": "Přístup k záznamům je omezen salonem a rolí uživatele. Lékařské dotazníky nejsou součástí pilotu."},
  'landing.faq.q4': {
    en: 'What happens after the trial ends?',
    ru: 'Что происходит после завершения пробного периода?',
    cz: 'Co se stane po skončení zkušebního období?',
  },
  'landing.faq.a4': {"en": "After the 7-day trial, you have 3 days of viewing without editing, AI or exports. Workspace data is then unavailable until a subscription is activated.", "ru": "После 7 дней пробного периода доступны ещё 3 дня просмотра без изменений, ИИ и выгрузки. Затем доступ к данным закрывается до подключения подписки.", "cz": "Po 7denním zkušebním období máte ještě 3 dny prohlížení bez úprav, AI a exportu. Poté jsou data nedostupná do aktivace předplatného."},
  'landing.faq.q5': {"en": "When can I export data?", "ru": "Когда доступна выгрузка данных?", "cz": "Kdy lze exportovat data?"},
  'landing.faq.a5': {"en": "Exports are available while your trial or CRM subscription is active. Exports are unavailable during the three-day viewing period and after access is paused.", "ru": "Выгрузка доступна во время активного пробного периода или подписки CRM. В трёхдневном режиме просмотра и после закрытия доступа выгрузка недоступна.", "cz": "Export je dostupný během aktivního zkušebního období nebo předplatného CRM. Během tří dnů prohlížení a po pozastavení přístupu není export dostupný."},

  'landing.nav.features': {
    en: 'Features',
    ru: 'Возможности',
    cz: 'Funkce',
  },
  'landing.nav.tour': {
    en: 'Interface',
    ru: 'Интерфейс',
    cz: 'Rozhraní',
  },
  'landing.nav.faq': {
    en: 'FAQ',
    ru: 'Вопросы',
    cz: 'Časté dotazy',
  },
  'landing.nav.pricing': {
    en: 'Pricing',
    ru: 'Тарифы',
    cz: 'Ceník',
  },
  'landing.pricing.title': {
    en: 'Simple and Transparent Pricing',
    ru: 'Простые и прозрачные тарифы',
    cz: 'Jednoduchý a přehledný ceník',
  },
  'landing.pricing.subtitle': {
    en: 'Independent products for CRM and AI assistant. Pay only for what your salon needs.',
    ru: 'Независимые продукты для CRM и ИИ ассистента. Выбирайте только то, что нужно вашему бизнесу.',
    cz: 'Nezávislé produkty pro CRM a AI asistentku. Plaťte jen za to, co váš salon potřebuje.',
  },
  'landing.pricing.crm_tab': {
    en: 'CRM Platform',
    ru: 'CRM система',
    cz: 'CRM platforma',
  },
  'landing.pricing.ai_tab': {
    en: 'AI Assistant Sasha',
    ru: 'ИИ ассистент Сашенька',
    cz: 'AI asistentka Sašenka',
  },
  'landing.pricing.per_month': {
    en: '/ month',
    ru: '/ месяц',
    cz: '/ měsíc',
  },
  'landing.pricing.choose_plan': {
    en: 'Get Started',
    ru: 'Выбрать тариф',
    cz: 'Vybrat tarif',
  },
  'landing.pricing.draft_badge': {
    en: 'Draft (D01)',
    ru: 'Черновик (D01)',
    cz: 'Návrh (D01)',
  },
  'landing.pricing.loading': {
    en: 'Loading pricing plans...',
    ru: 'Загрузка тарифов...',
    cz: 'Načítání ceníku...',
  },
  'landing.pricing.error': {
    en: 'Failed to load pricing plans',
    ru: 'Не удалось загрузить тарифы',
    cz: 'Nepodařilo se načíst ceník',
  },
  'landing.nav.contact': {
    en: 'Contact',
    ru: 'Контакты',
    cz: 'Kontakt',
  },

  'landing.footer.rights': {
    en: 'All rights reserved.',
    ru: 'Все права защищены.',
    cz: 'Všechna práva vyhrazena.',
  },
  'landing.footer.privacy': {
    en: 'Privacy Policy',
    ru: 'Политика конфиденциальности',
    cz: 'Zásady ochrany osobních údajů',
  },
  'landing.footer.terms': {
    en: 'Terms of Service',
    ru: 'Условия использования',
    cz: 'Obchodní podmínky',
  },
  'landing.footer.status_preview': {
    en: 'Legal documentation preview',
    ru: 'Предварительный просмотр документов',
    cz: 'Náhled právní dokumentace',
  },
  'landing.footer.contact_support': {
    en: 'Support & Questions',
    ru: 'Поддержка и вопросы',
    cz: 'Podpora a dotazy',
  },

  'notfound.title': {
    en: 'Page not found',
    ru: 'Страница не найдена',
    cz: 'Stránka nebyla nalezena',
  },
  'notfound.subtitle': {
    en: 'The requested page does not exist or has been moved.',
    ru: 'Запрошенная страница не существует или была перемещена.',
    cz: 'Požadovaná stránka neexistuje nebo byla přesunuta.',
  },
  'notfound.to_home': {
    en: 'Go to Homepage',
    ru: 'На главную страницу',
    cz: 'Na hlavní stránku',
  },
  'notfound.to_app': {
    en: 'Go to CRM Workspace',
    ru: 'В рабочее пространство CRM',
    cz: 'Do pracovního prostoru CRM',
  },
  'onboarding.welcome.ownerTitle': { en: 'Welcome to Xtrix', ru: 'Добро пожаловать в Xtrix', cz: 'Vítejte v Xtrixu' },
  'onboarding.welcome.ownerBody': { en: 'Create your business, add the first service and set working hours. You can stop and continue later.', ru: 'Создайте бизнес, добавьте первую услугу и настройте рабочие часы. Можно остановиться и продолжить позже.', cz: 'Vytvořte firmu, přidejte první službu a nastavte pracovní hodiny. Můžete přestat a pokračovat později.' },
  'onboarding.welcome.soloTitle': { en: 'Welcome to Xtrix', ru: 'Добро пожаловать в Xtrix', cz: 'Vítejte v Xtrixu' },
  'onboarding.welcome.soloBody': { en: 'Start with the first service. The workspace is already yours — no employee needed.', ru: 'Начните с первой услуги. Рабочее пространство уже ваше — сотрудник не обязателен.', cz: 'Začněte první službou. Pracovní prostor je váš — zaměstnanec není potřeba.' },
  'onboarding.welcome.staffTitle': { en: 'Welcome to the team workspace', ru: 'Добро пожаловать в рабочее пространство команды', cz: 'Vítejte v týmovém pracovním prostoru' },
  'onboarding.welcome.staffBody': { en: 'The owner has set up the business. Here you will find visits, clients and your schedule.', ru: 'Владелец уже настроил бизнес. Здесь будут визиты, клиенты и ваше расписание.', cz: 'Majitel už firmu nastavil. Najdete zde návštěvy, klienty a svůj rozvrh.' },
  'onboarding.welcome.start': { en: 'Start setup', ru: 'Начать настройку', cz: 'Začít nastavení' },
  'onboarding.welcome.open': { en: 'Open workspace', ru: 'Открыть рабочее пространство', cz: 'Otevřít pracovní prostor' },
  'onboarding.welcome.later': { en: 'Maybe later', ru: 'Позже', cz: 'Později' },
  'onboarding.checklist.expand': { en: 'Show all steps', ru: 'Все шаги настройки', cz: 'Zobrazit všechny kroky' },
  'onboarding.checklist.collapse': { en: 'Collapse steps', ru: 'Свернуть шаги', cz: 'Sbalit kroky' },
  'onboarding.checklist.title': { en: 'Getting started', ru: 'С чего начать', cz: 'Jak začít' },
  'onboarding.checklist.description': { en: 'You can return to these steps later.', ru: 'К этим шагам можно вернуться позже.', cz: 'K těmto krokům se můžete vrátit později.' },
  'onboarding.checklist.progressLabel': { en: 'Completed', ru: 'Выполнено', cz: 'Hotovo' },
  'onboarding.checklist.hide': { en: 'Hide checklist', ru: 'Скрыть список', cz: 'Skrýt seznam' },
  'onboarding.checklist.locked': { en: 'Available in an upcoming release', ru: 'Появится в ближайшем обновлении', cz: 'Bude v některé z příštích aktualizací' },
  'onboarding.checklist.done': { en: 'Done', ru: 'Готово', cz: 'Hotovo' },
  'onboarding.checklist.next': { en: 'Next step', ru: 'Следующий шаг', cz: 'Další krok' },
  'onboarding.checklist.allDone': { en: 'Setup is complete', ru: 'Настройка завершена', cz: 'Nastavení je hotové' },
  'onboarding.step.business.title': { en: 'Create your business', ru: 'Создайте бизнес', cz: 'Vytvořte firmu' },
  'onboarding.step.business.body': { en: 'Name, currency and contacts — used on documents and on the booking page.', ru: 'Название, валюта и контакты — для документов и страницы записи.', cz: 'Název, měna a kontakty — pro dokumenty a rezervační stránku.' },
  'onboarding.step.business.cta': { en: 'Create business', ru: 'Создать бизнес', cz: 'Vytvořit firmu' },
  'onboarding.step.service.title': { en: 'Add your first service', ru: 'Добавьте первую услугу', cz: 'Přidejte první službu' },
  'onboarding.step.service.body': { en: 'Price and duration are shown to clients before booking.', ru: 'Цену и длительность клиент видит до записи.', cz: 'Cenu a délku klient uvidí před rezervací.' },
  'onboarding.step.service.cta': { en: 'Add service', ru: 'Добавить услугу', cz: 'Přidat službu' },
  'onboarding.step.staff.title': { en: 'Add your team', ru: 'Добавьте команду', cz: 'Přidejte tým' },
  'onboarding.step.staff.body': { en: 'Invite a master, or keep the service assigned to you and work on your own.', ru: 'Добавьте мастера или оставьте услугу на себе и работайте сами.', cz: 'Přidejte mistra, nebo si službu nechte a pracujte sami.' },
  'onboarding.step.staff.cta': { en: 'Add master', ru: 'Добавить мастера', cz: 'Přidat mistra' },
  'onboarding.step.staff.soloTitle': { en: 'I work alone', ru: 'Работаю сам', cz: 'Pracuji sám' },
  'onboarding.step.staff.workAlone': { en: 'I work alone', ru: 'Работаю сам', cz: 'Pracuji sám' },
  'onboarding.step.schedule.title': { en: 'Set working hours', ru: 'Настройте рабочие часы', cz: 'Nastavte pracovní hodiny' },
  'onboarding.step.schedule.body': { en: 'Clients only see slots inside your working hours.', ru: 'Клиенты видят только окна внутри вашего графика.', cz: 'Klienti vidí jen termíny v rámci vašich hodin.' },
  'onboarding.step.schedule.cta': { en: 'Set schedule', ru: 'Настроить график', cz: 'Nastavit rozvrh' },
  'onboarding.step.booking.title': { en: 'Turn on online booking', ru: 'Включите онлайн-запись', cz: 'Zapněte online rezervace' },
  'onboarding.step.booking.body': { en: 'Share your link and let clients book a free slot themselves.', ru: 'Поделитесь ссылкой — клиенты сами выберут свободное время.', cz: 'Sdílejte odkaz a klienti si sami vyberou volný termín.' },
  'onboarding.step.booking.cta': { en: 'Set up booking', ru: 'Настроить запись', cz: 'Nastavit rezervace' },
  'onboarding.step.cancel': { en: 'Cancel', ru: 'Отмена', cz: 'Zrušit' },
  'onboarding.hint.clients.title': { en: 'Start with your first client', ru: 'Начните с первого клиента', cz: 'Začněte prvním klientem' },
  'onboarding.hint.clients.body': { en: 'A client card keeps contacts, visits and notes in one place.', ru: 'Карточка клиента хранит контакты, визиты и заметки вместе.', cz: 'Karta klienta drží kontakty, návštěvy a poznámky na jednom místě.' },
  'onboarding.hint.clients.cta': { en: 'Add client', ru: 'Добавить клиента', cz: 'Přidat klienta' },
  'onboarding.hint.services.title': { en: 'Add your first service', ru: 'Добавьте первую услугу', cz: 'Přidejte první službu' },
  'onboarding.hint.services.body': { en: 'Name, price and duration — clients see them before booking.', ru: 'Название, цена и длительность — клиент видит их до записи.', cz: 'Název, cena a délka — klient je uvidí před rezervací.' },
  'onboarding.hint.services.cta': { en: 'Add service', ru: 'Добавить услугу', cz: 'Přidat službu' },
  'onboarding.hint.calendar.title': { en: 'No visits yet', ru: 'Визитов пока нет', cz: 'Zatím žádné návštěvy' },
  'onboarding.hint.calendar.body': { en: 'Create a visit to see it on the calendar.', ru: 'Создайте визит, чтобы он появился в календаре.', cz: 'Vytvořte návštěvu, aby se objevila v kalendáři.' },
  'onboarding.hint.calendar.cta': { en: 'Create visit', ru: 'Создать визит', cz: 'Vytvořit návštěvu' },
  'onboarding.hint.dismiss': { en: 'Dismiss', ru: 'Скрыть', cz: 'Skrýt' },
  'onboarding.tour.title': { en: 'Quick tour', ru: 'Короткий тур', cz: 'Krátká prohlídka' },
  'onboarding.tour.dashboard': { en: 'Dashboard shows revenue, visits and clients at a glance.', ru: 'Панель показывает выручку, визиты и клиентов.', cz: 'Nástěnka ukazuje tržby, návštěvy a klienty.' },
  'onboarding.tour.clients': { en: 'Clients keeps cards and visit history.', ru: 'Клиенты — карточки и история визитов.', cz: 'Klienti — karty a historie návštěv.' },
  'onboarding.tour.calendar': { en: 'Calendar is your working day.', ru: 'Календарь — ваш рабочий день.', cz: 'Kalendář je váš pracovní den.' },
  'onboarding.tour.dashboardBody': { en: 'The dashboard shows the state of the business at a glance.', ru: 'На дашборде видно состояние бизнеса с первого взгляда.', cz: 'Na přehledu vidíte stav firmy na první pohled.' },
  'onboarding.tour.clientsBody': { en: 'Client cards keep contacts, visits and notes in one place.', ru: 'Карточки клиентов хранят контакты, визиты и заметки вместе.', cz: 'Karty klientů drží kontakty, návštěvy a poznámky na jednom místě.' },
  'onboarding.tour.calendarBody': { en: 'The calendar shows visits by day and by master.', ru: 'Календарь показывает визиты по дням и мастерам.', cz: 'Kalendář ukazuje návštěvy podle dnů a mistrů.' },
  'onboarding.tour.assistantBody': { en: 'Sashka helps with plans and everyday questions.', ru: 'Сашенька помогает с планами и повседневными вопросами.', cz: 'Sašenka pomáhá s plány a každodenními otázkami.' },
  'onboarding.tour.assistant': { en: 'The assistant plans visits and other actions from plain words.', ru: 'Ассистент планирует визиты и другие действия по тексту.', cz: 'Asistent naplánuje návštěvy a další akce z běžného textu.' },
  'onboarding.tour.next': { en: 'Next', ru: 'Дальше', cz: 'Další' },
  'onboarding.tour.back': { en: 'Back', ru: 'Назад', cz: 'Zpět' },
  'onboarding.tour.skip': { en: 'Skip', ru: 'Пропустить', cz: 'Přeskočit' },
  'onboarding.tour.done': { en: 'Got it', ru: 'Понятно', cz: 'Rozumím' },
  'onboarding.settings.title': { en: 'Hints and tour', ru: 'Подсказки и тур', cz: 'Tipy a prohlídka' },
  'onboarding.settings.description': { en: 'Show the first-run checklist and the navigation tour again. Business data is not changed.', ru: 'Снова показать чеклист первого входа и тур по навигации. Данные бизнеса не меняются.', cz: 'Znovu zobrazit úvodní seznam a prohlídku navigace. Data firmy se nemění.' },
  'onboarding.settings.showTour': { en: 'Show tour again', ru: 'Показать тур снова', cz: 'Zobrazit prohlídku znovu' },
  'onboarding.settings.showChecklist': { en: 'Show checklist again', ru: 'Показать чеклист снова', cz: 'Zobrazit seznam znovu' },
  'onboarding.settings.saved': { en: 'Updated', ru: 'Обновлено', cz: 'Aktualizováno' },
  'onboarding.settings.saveError': { en: 'Failed to update settings', ru: 'Не удалось обновить настройки', cz: 'Nastavení se nepodařilo aktualizovat' },
  'onboarding.error.save': { en: 'Could not save the choice. Try again.', ru: 'Не удалось сохранить выбор. Попробуйте ещё раз.', cz: 'Volbu se nepodařilo uložit. Zkuste to znovu.' },

  'nav.schedule': { en: 'Schedule', ru: 'График', cz: 'Rozvrh' },
  'schedule.title': { en: 'Work schedule', ru: 'График работы', cz: 'Pracovní rozvrh' },
  'schedule.subtitle': { en: 'Weekly hours, days off and booking rules for each master.', ru: 'Недельные часы, выходные и правила записи для каждого мастера.', cz: 'Týdenní hodiny, volné dny a pravidla rezervace pro každého mistra.' },
  'schedule.noAccess': { en: 'Only the owner or a master can manage work schedules.', ru: 'Графиком могут управлять только владелец или мастер.', cz: 'Rozvrh mohou spravovat pouze majitel nebo mistr.' },
  'schedule.specialist': { en: 'Master', ru: 'Мастер', cz: 'Mistr' },
  'schedule.timezone': { en: 'Time zone', ru: 'Часовой пояс', cz: 'Časové pásmo' },
  'schedule.tab.weekly': { en: 'Weekly hours', ru: 'Недельные часы', cz: 'Týdenní hodiny' },
  'schedule.tab.exceptions': { en: 'Days off and blocks', ru: 'Выходные и блоки', cz: 'Volné dny a blokace' },
  'schedule.tab.rules': { en: 'Booking rules', ru: 'Правила записи', cz: 'Pravidla rezervace' },
  'schedule.weekly.hint': { en: 'Add one or more working windows per day. Times are shown in the business time zone.', ru: 'Добавьте одно или несколько рабочих окон на день. Время показано в часовом поясе бизнеса.', cz: 'Přidejte jedno nebo více pracovních oken na den. Časy jsou v časovém pásmu firmy.' },
  'schedule.weekday.mon': { en: 'Monday', ru: 'Понедельник', cz: 'Pondělí' },
  'schedule.weekday.tue': { en: 'Tuesday', ru: 'Вторник', cz: 'Úterý' },
  'schedule.weekday.wed': { en: 'Wednesday', ru: 'Среда', cz: 'Středa' },
  'schedule.weekday.thu': { en: 'Thursday', ru: 'Четверг', cz: 'Čtvrtek' },
  'schedule.weekday.fri': { en: 'Friday', ru: 'Пятница', cz: 'Pátek' },
  'schedule.weekday.sat': { en: 'Saturday', ru: 'Суббота', cz: 'Sobota' },
  'schedule.weekday.sun': { en: 'Sunday', ru: 'Воскресенье', cz: 'Neděle' },
  'schedule.dayOff': { en: 'Day off', ru: 'Выходной', cz: 'Volno' },
  'schedule.addWindow': { en: 'Add hours', ru: 'Добавить часы', cz: 'Přidat hodiny' },
  'schedule.start': { en: 'Start', ru: 'Начало', cz: 'Začátek' },
  'schedule.end': { en: 'End', ru: 'Конец', cz: 'Konec' },
  'schedule.reason': { en: 'Note', ru: 'Заметка', cz: 'Poznámka' },
  'schedule.reasonPlaceholder': { en: 'e.g. vacation', ru: 'например, отпуск', cz: 'např. dovolená' },
  'schedule.confirmDelete': { en: 'Confirm delete', ru: 'Подтвердить удаление', cz: 'Potvrdit smazání' },
  'schedule.error.timeRange': { en: 'The end must be at least an hour after the start.', ru: 'Конец должен быть минимум на час позже начала.', cz: 'Konec musí být alespoň o hodinu po začátku.' },
  'schedule.error.bufferRange': { en: 'Buffers must be whole minutes from 0 to 1440.', ru: 'Буферы — целые минуты от 0 до 1440.', cz: 'Buffery jsou celé minuty od 0 do 1440.' },
  'schedule.error.horizonRange': { en: 'The horizon must be from 1 to 365 days.', ru: 'Горизонт должен быть от 1 до 365 дней.', cz: 'Horizont musí být 1 až 365 dní.' },
  'schedule.error.leadRange': { en: 'Lead time must be from 0 to 10080 minutes.', ru: 'Время до записи должно быть от 0 до 10080 минут.', cz: 'Čas před rezervací musí být 0 až 10080 minut.' },
  'schedule.error.save': { en: 'Could not save the changes. Try again.', ru: 'Не удалось сохранить изменения. Попробуйте ещё раз.', cz: 'Změny se nepodařilo uložit. Zkuste to znovu.' },
  'schedule.error.load': { en: 'Could not load the schedule.', ru: 'Не удалось загрузить график.', cz: 'Rozvrh se nepodařilo načíst.' },
  'schedule.exceptions.hint': { en: 'A day off or custom hours replace the weekly schedule for that date only.', ru: 'Выходной или свои часы заменяют недельный график только на эту дату.', cz: 'Volno nebo vlastní hodiny nahradí týdenní rozvrh pouze pro dané datum.' },
  'schedule.exceptions.title': { en: 'Days off and vacations', ru: 'Выходные и отпуска', cz: 'Volné dny a dovolené' },
  'schedule.exceptions.closed': { en: 'Close the whole day or set special working hours for one date.', ru: 'Закройте весь день или задайте особые часы на одну дату.', cz: 'Zavřete celý den nebo nastavte zvláštní hodiny pro jedno datum.' },
  'schedule.exceptions.closedLabel': { en: 'Closed all day', ru: 'Закрыто весь день', cz: 'Zavřeno celý den' },
  'schedule.exceptions.day': { en: 'Date', ru: 'Дата', cz: 'Datum' },
  'schedule.exceptions.add': { en: 'Add day off', ru: 'Добавить выходной', cz: 'Přidat volný den' },
  'schedule.exceptions.update': { en: 'Save day', ru: 'Сохранить день', cz: 'Uložit den' },
  'schedule.exceptions.empty': { en: 'No exceptions yet.', ru: 'Исключений пока нет.', cz: 'Zatím žádné výjimky.' },
  'schedule.blocks.title': { en: 'Breaks and personal blocks', ru: 'Перерывы и личные блоки', cz: 'Přestávky a osobní blokace' },
  'schedule.blocks.hint': { en: 'Lunch, a doctor or anything else that must stay free. Times are converted from the business time zone.', ru: 'Обед, врач или другое личное время. Время пересчитывается из часового пояса бизнеса.', cz: 'Oběd, lékař nebo jiný osobní čas. Časy se převádějí z časového pásma firmy.' },
  'schedule.blocks.add': { en: 'Add block', ru: 'Добавить блок', cz: 'Přidat blokaci' },
  'schedule.blocks.empty': { en: 'No blocks yet.', ru: 'Блоков пока нет.', cz: 'Zatím žádné blokace.' },
  'schedule.rules.title': { en: 'Booking rules', ru: 'Правила записи', cz: 'Pravidla rezervace' },
  'schedule.rules.hint': { en: 'These rules only change online booking. Work windows, days off and existing visits stay as they are.', ru: 'Эти правила меняют только онлайн-запись. Рабочие окна, выходные и существующие визиты не меняются.', cz: 'Tato pravidla mění pouze online rezervace. Pracovní okna, volné dny a existující návštěvy zůstávají.' },
  'schedule.rules.noBusiness': { en: 'Create a business first to set booking rules.', ru: 'Сначала создайте бизнес, чтобы настроить правила записи.', cz: 'Nejprve vytvořte firmu pro nastavení pravidel rezervace.' },
  'schedule.rules.timezone': { en: 'Business time zone', ru: 'Часовой пояс бизнеса', cz: 'Časové pásmo firmy' },
  'schedule.rules.timezoneHint': { en: 'IANA name, for example Europe/Prague', ru: 'IANA-название, например Europe/Prague', cz: 'Název IANA, například Europe/Prague' },
  'schedule.rules.horizon': { en: 'Booking horizon, days', ru: 'Горизонт записи, дней', cz: 'Horizont rezervace, dny' },
  'schedule.rules.horizonHint': { en: 'How far ahead clients can book', ru: 'На сколько дней вперёд можно записаться', cz: 'Jak daleko dopředu lze rezervovat' },
  'schedule.rules.lead': { en: 'Minimum notice, minutes', ru: 'Минимум до записи, минут', cz: 'Minimální předstih, minuty' },
  'schedule.rules.leadHint': { en: '0 means clients can book the next free slot', ru: '0 — можно записаться на ближайшее свободное время', cz: '0 znamená rezervaci nejbližšího volného termínu' },
  'schedule.rules.readOnly': { en: 'Only the business owner can change these rules.', ru: 'Эти правила может менять только владелец бизнеса.', cz: 'Tato pravidla může měnit pouze majitel firmy.' },
  'schedule.rules.save': { en: 'Save rules', ru: 'Сохранить правила', cz: 'Uložit pravidla' },
  'schedule.rules.saved': { en: 'Rules saved.', ru: 'Правила сохранены.', cz: 'Pravidla uložena.' },
  'schedule.buffers.title': { en: 'Service buffers', ru: 'Буферы услуг', cz: 'Buffery služeb' },
  'schedule.buffers.hint': { en: 'Extra time around a visit for preparation and cleanup. The service duration stays unchanged.', ru: 'Дополнительное время вокруг визита на подготовку и уборку. Длительность услуги не меняется.', cz: 'Dodatečný čas kolem návštěvy na přípravu a úklid. Délka služby zůstává stejná.' },
  'schedule.buffers.duration': { en: 'Service duration', ru: 'Длительность услуги', cz: 'Délka služby' },
  'schedule.buffers.before': { en: 'Before, min', ru: 'До, мин', cz: 'Před, min' },
  'schedule.buffers.after': { en: 'After, min', ru: 'После, мин', cz: 'Po, min' },
  'schedule.buffers.empty': { en: 'No services yet.', ru: 'Услуг пока нет.', cz: 'Zatím žádné služby.' },

  'nav.questionnaires': { en: 'Questionnaires', ru: 'Анкеты', cz: 'Dotazníky' },
  'questionnaires.title': { en: 'Questionnaires', ru: 'Анкеты', cz: 'Dotazníky' },
  'questionnaires.new': { en: 'New questionnaire', ru: 'Новая анкета', cz: 'Nový dotazník' },
  'questionnaires.emptyTitle': { en: 'No questionnaires yet', ru: 'Анкет пока нет', cz: 'Zatím žádné dotazníky' },
  'questionnaires.emptyDescription': {
    en: 'Ask guests a few questions before their visit. You choose the questions.',
    ru: 'Задайте гостям несколько вопросов перед визитом. Вопросы выбираете вы.',
    cz: 'Položte hostům několik otázek před návštěvou. Otázky volíte vy.',
  },
  'questionnaires.fieldsCount': { en: 'Fields', ru: 'Поля', cz: 'Pole' },
  'questionnaires.service': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'questionnaires.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'questionnaires.updated': { en: 'Updated', ru: 'Обновлено', cz: 'Aktualizováno' },
  'questionnaires.publishedVersion': { en: 'Published version', ru: 'Опубликованная версия', cz: 'Publikovaná verze' },
  'questionnaires.draftOnly': { en: 'Draft only', ru: 'Только черновик', cz: 'Pouze koncept' },
  'questionnaires.noService': { en: 'No service', ru: 'Без услуги', cz: 'Bez služby' },
  'questionnaires.businessRequired': {
    en: 'Create your business first, questionnaires belong to it.',
    ru: 'Сначала создайте бизнес, анкеты привязаны к нему.',
    cz: 'Nejprve vytvořte firmu, dotazníky k ní patří.',
  },
  'questionnaires.noAccess': {
    en: 'Only the business owner can manage questionnaires.',
    ru: 'Управлять анкетами может только владелец бизнеса.',
    cz: 'Dotazníky může spravovat pouze majitel firmy.',
  },
  'questionnaires.untitled': { en: 'Untitled questionnaire', ru: 'Анкета без названия', cz: 'Dotazník bez názvu' },
  'questionnaires.emptyFields': {
    en: 'No fields yet. Add at least one before publishing.',
    ru: 'Полей пока нет. Добавьте хотя бы одно перед публикацией.',
    cz: 'Zatím žádná pole. Před publikováním přidejte alespoň jedno.',
  },
  'questionnaires.backToList': { en: 'Back to list', ru: 'К списку', cz: 'Zpět na seznam' },

  'questionnaireEditor.createTitle': { en: 'New questionnaire', ru: 'Новая анкета', cz: 'Nový dotazník' },
  'questionnaireEditor.editTitle': { en: 'Edit questionnaire', ru: 'Редактирование анкеты', cz: 'Úprava dotazníku' },
  'questionnaireEditor.name': { en: 'Name', ru: 'Название', cz: 'Název' },
  'questionnaireEditor.namePlaceholder': {
    en: 'e.g. Before your first visit',
    ru: 'например, Перед первым визитом',
    cz: 'např. Před první návštěvou',
  },
  'questionnaireEditor.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'questionnaireEditor.descriptionPlaceholder': {
    en: 'Optional note for guests',
    ru: 'Необязательное пояснение для гостей',
    cz: 'Volitelná poznámka pro hosty',
  },
  'questionnaireEditor.service': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'questionnaireEditor.serviceHint': {
    en: 'Applied when you publish; it decides which visits can use this questionnaire.',
    ru: 'Применяется при публикации и определяет, для каких визитов доступна анкета.',
    cz: 'Použije se při publikování a určuje, pro které návštěvy je dotazník dostupný.',
  },
  'questionnaireEditor.fields': { en: 'Fields', ru: 'Поля', cz: 'Pole' },
  'questionnaireEditor.fieldsHint': {
    en: 'Guests see the questions in this order.',
    ru: 'Гости видят вопросы в этом порядке.',
    cz: 'Hosté vidí otázky v tomto pořadí.',
  },
  'questionnaireEditor.add': { en: 'Add field', ru: 'Добавить поле', cz: 'Přidat pole' },
  'questionnaireEditor.type': { en: 'Type', ru: 'Тип', cz: 'Typ' },
  'questionnaireEditor.label': { en: 'Question', ru: 'Вопрос', cz: 'Otázka' },
  'questionnaireEditor.labelPlaceholder': {
    en: 'What should the guest answer?',
    ru: 'Что должен ответить гость?',
    cz: 'Co má host odpovědět?',
  },
  'questionnaireEditor.fieldHint': { en: 'Hint', ru: 'Подсказка', cz: 'Nápověda' },
  'questionnaireEditor.fieldHintPlaceholder': {
    en: 'Optional explanation',
    ru: 'Необязательное пояснение',
    cz: 'Volitelné vysvětlení',
  },
  'questionnaireEditor.required': { en: 'Required', ru: 'Обязательный', cz: 'Povinné' },
  'questionnaireEditor.options': { en: 'Options', ru: 'Варианты', cz: 'Možnosti' },
  'questionnaireEditor.optionsHint': {
    en: 'One option per line, at least two.',
    ru: 'По одному варианту в строке, минимум два.',
    cz: 'Jedna možnost na řádek, alespoň dvě.',
  },
  'questionnaireEditor.maxSelected': { en: 'Max choices', ru: 'Максимум выборов', cz: 'Maximálně voleb' },
  'questionnaireEditor.maxSelectedHint': {
    en: 'Leave empty for no limit',
    ru: 'Оставьте пустым без ограничения',
    cz: 'Nechte prázdné bez omezení',
  },
  'questionnaireEditor.moveUp': { en: 'Move up', ru: 'Вверх', cz: 'Nahoru' },
  'questionnaireEditor.moveDown': { en: 'Move down', ru: 'Вниз', cz: 'Dolů' },
  'questionnaireEditor.remove': { en: 'Remove field', ru: 'Удалить поле', cz: 'Odebrat pole' },
  'questionnaireEditor.keyHint': { en: 'Answer key', ru: 'Ключ ответа', cz: 'Klíč odpovědi' },
  'questionnaireEditor.preview': { en: 'Preview', ru: 'Предпросмотр', cz: 'Náhled' },
  'questionnaireEditor.hidePreview': { en: 'Hide preview', ru: 'Скрыть предпросмотр', cz: 'Skrýt náhled' },
  'questionnaireEditor.previewTitle': { en: 'Guest preview', ru: 'Предпросмотр для гостя', cz: 'Náhled pro hosta' },
  'questionnaireEditor.noFields': {
    en: 'Add a field to see the preview.',
    ru: 'Добавьте поле, чтобы увидеть предпросмотр.',
    cz: 'Přidejte pole pro zobrazení náhledu.',
  },
  'questionnaireEditor.type.text': { en: 'Short text', ru: 'Короткий текст', cz: 'Krátký text' },
  'questionnaireEditor.type.long_text': { en: 'Long text', ru: 'Длинный текст', cz: 'Dlouhý text' },
  'questionnaireEditor.type.single_choice': { en: 'One option', ru: 'Один вариант', cz: 'Jedna možnost' },
  'questionnaireEditor.type.multi_choice': { en: 'Several options', ru: 'Несколько вариантов', cz: 'Několik možností' },
  'questionnaireEditor.type.boolean': { en: 'Yes / no', ru: 'Да / нет', cz: 'Ano / ne' },
  'questionnaireEditor.answerPlaceholder': { en: 'Guest answer', ru: 'Ответ гостя', cz: 'Odpověď hosta' },
  'questionnaireEditor.saveDraft': { en: 'Save draft', ru: 'Сохранить черновик', cz: 'Uložit koncept' },
  'questionnaireEditor.publish': { en: 'Publish', ru: 'Опубликовать', cz: 'Publikovat' },
  'questionnaireEditor.publishing': { en: 'Publishing...', ru: 'Публикация...', cz: 'Publikování...' },
  'questionnaireEditor.saved': { en: 'Draft saved.', ru: 'Черновик сохранён.', cz: 'Koncept uložen.' },
  'questionnaireEditor.saveError': {
    en: 'Could not save the questionnaire.',
    ru: 'Не удалось сохранить анкету.',
    cz: 'Dotazník se nepodařilo uložit.',
  },
  'questionnaireEditor.publishError': {
    en: 'Could not publish the questionnaire.',
    ru: 'Не удалось опубликовать анкету.',
    cz: 'Dotazník se nepodařilo publikovat.',
  },
  'questionnaireEditor.errorName': { en: 'Give the questionnaire a name.', ru: 'Укажите название анкеты.', cz: 'Zadejte název dotazníku.' },
  'questionnaireEditor.errorLabel': {
    en: 'Every field needs a question.',
    ru: 'У каждого поля должен быть вопрос.',
    cz: 'Každé pole potřebuje otázku.',
  },
  'questionnaireEditor.errorOptionsCount': {
    en: 'Add between 2 and 20 options.',
    ru: 'Добавьте от 2 до 20 вариантов.',
    cz: 'Přidejte 2 až 20 možností.',
  },
  'questionnaireEditor.errorOptionsDuplicate': {
    en: 'Options must be different.',
    ru: 'Варианты не должны повторяться.',
    cz: 'Možnosti se nesmí opakovat.',
  },
  'questionnaireEditor.errorOptionLong': {
    en: 'An option is too long.',
    ru: 'Один из вариантов слишком длинный.',
    cz: 'Některá možnost je příliš dlouhá.',
  },
  'questionnaireEditor.errorMaxSelected': {
    en: 'The limit must be between 1 and the number of options.',
    ru: 'Ограничение должно быть от 1 до числа вариантов.',
    cz: 'Limit musí být mezi 1 a počtem možností.',
  },
  'questionnaireEditor.errorFieldsRequired': {
    en: 'Add at least one field before publishing.',
    ru: 'Добавьте хотя бы одно поле перед публикацией.',
    cz: 'Před publikováním přidejte alespoň jedno pole.',
  },
  'questionnaireEditor.errorPlainText': {
    en: 'Use plain text without < or >.',
    ru: 'Используйте обычный текст без < и >.',
    cz: 'Použijte prostý text bez < a >.',
  },

  'bookingManage.title': { en: 'Manage booking', ru: 'Управление записью', cz: 'Správa rezervace' },
  'bookingManage.unavailableTitle': {
    en: 'This booking link is unavailable',
    ru: 'Эта ссылка на запись недоступна',
    cz: 'Tento odkaz na rezervaci není dostupný',
  },
  'bookingManage.unavailableText': {
    en: 'The link may have expired or the booking was removed. Contact the business for help.',
    ru: 'Ссылка могла устареть или запись удалена. Свяжитесь с салоном.',
    cz: 'Odkaz mohl vypršet nebo byla rezervace odstraněna. Kontaktujte firmu.',
  },
  'bookingManage.loadError': {
    en: 'Could not load the booking.',
    ru: 'Не удалось загрузить запись.',
    cz: 'Rezervaci se nepodařilo načíst.',
  },
  'bookingManage.actions': { en: 'What would you like to do?', ru: 'Что хотите сделать?', cz: 'Co chcete udělat?' },
  'bookingManage.confirmedAt': { en: 'Confirmed', ru: 'Подтверждено', cz: 'Potvrzeno' },
  'bookingManage.confirm': { en: 'Confirm booking', ru: 'Подтвердить запись', cz: 'Potvrdit rezervaci' },
  'bookingManage.confirming': { en: 'Confirming...', ru: 'Подтверждаем...', cz: 'Potvrzuji...' },
  'bookingManage.confirmed': {
    en: 'Your booking is confirmed.',
    ru: 'Запись подтверждена.',
    cz: 'Rezervace je potvrzena.',
  },
  'bookingManage.confirmError': {
    en: 'Could not confirm the booking.',
    ru: 'Не удалось подтвердить запись.',
    cz: 'Rezervaci se nepodařilo potvrdit.',
  },
  'bookingManage.reschedule': { en: 'Reschedule', ru: 'Перенести', cz: 'Přeložit' },
  'bookingManage.rescheduleTitle': {
    en: 'Choose a new time',
    ru: 'Выберите новое время',
    cz: 'Vyberte nový čas',
  },
  'bookingManage.newTime': {
    en: 'New date and time (your local time)',
    ru: 'Новая дата и время (по вашему времени)',
    cz: 'Nové datum a čas (váš místní čas)',
  },
  'bookingManage.newTimeHint': {
    en: 'Availability is checked when you save. If the time is taken, the current booking stays unchanged.',
    ru: 'Доступность проверится при сохранении. Если время занято, текущая запись не изменится.',
    cz: 'Dostupnost se ověří při uložení. Pokud je čas obsazený, stávající rezervace zůstane nezměněná.',
  },
  'bookingManage.salonTime': { en: 'Salon time', ru: 'Время салона', cz: 'Čas salonu' },
  'bookingManage.submitReschedule': { en: 'Move booking', ru: 'Перенести запись', cz: 'Přeložit rezervaci' },
  'bookingManage.rescheduling': { en: 'Moving...', ru: 'Переносим...', cz: 'Překládám...' },
  'bookingManage.rescheduled': {
    en: 'Your booking has been moved.',
    ru: 'Запись перенесена.',
    cz: 'Rezervace byla přeložena.',
  },
  'bookingManage.rescheduleError': {
    en: 'Could not move the booking.',
    ru: 'Не удалось перенести запись.',
    cz: 'Rezervaci se nepodařilo přeložit.',
  },
  'bookingManage.cancel': { en: 'Cancel booking', ru: 'Отменить запись', cz: 'Zrušit rezervaci' },
  'bookingManage.cancelQuestion': {
    en: 'Cancel this booking? The time will be released and cannot be restored.',
    ru: 'Отменить эту запись? Время освободится, восстановить его не получится.',
    cz: 'Zrušit tuto rezervaci? Čas se uvolní a již jej nebude možné obnovit.',
  },
  'bookingManage.cancelKeep': { en: 'Keep booking', ru: 'Оставить запись', cz: 'Ponechat rezervaci' },
  'bookingManage.cancelConfirm': { en: 'Yes, cancel', ru: 'Да, отменить', cz: 'Ano, zrušit' },
  'bookingManage.cancelling': { en: 'Cancelling...', ru: 'Отменяем...', cz: 'Ruším...' },
  'bookingManage.cancelled': { en: 'The booking is cancelled.', ru: 'Запись отменена.', cz: 'Rezervace je zrušena.' },
  'bookingManage.cancelError': {
    en: 'Could not cancel the booking.',
    ru: 'Не удалось отменить запись.',
    cz: 'Rezervaci se nepodařilo zrušit.',
  },
  'bookingManage.cutoffNote': {
    en: 'Online rescheduling and cancellation are available until 24 hours before the visit.',
    ru: 'Онлайн-перенос и отмена доступны не позднее чем за 24 часа до визита.',
    cz: 'Online přeložení a zrušení je možné nejpozději 24 hodin před návštěvou.',
  },
  'bookingManage.cutoffReached': {
    en: 'Online rescheduling and cancellation are closed less than 24 hours before the visit. Contact the business.',
    ru: 'Онлайн-перенос и отмена закрыты менее чем за 24 часа до визита. Свяжитесь с салоном.',
    cz: 'Online přeložení a zrušení je uzavřeno méně než 24 hodin před návštěvou. Kontaktujte firmu.',
  },
  'bookingManage.started': {
    en: 'This visit has already started.',
    ru: 'Этот визит уже начался.',
    cz: 'Tato návštěva již začala.',
  },
  'bookingManage.linkValidUntil': {
    en: 'This link is valid until',
    ru: 'Ссылка действует до',
    cz: 'Odkaz je platný do',
  },
  'bookingManage.error.timeRequired': {
    en: 'Choose a new date and time.',
    ru: 'Выберите новую дату и время.',
    cz: 'Vyberte nové datum a čas.',
  },
  'bookingManage.error.sameTime': {
    en: 'This is already the booked time. Choose another one.',
    ru: 'Это уже текущее время записи. Выберите другое.',
    cz: 'Toto je již rezervovaný čas. Vyberte jiný.',
  },
  'bookingManage.error.timePast': {
    en: 'Choose a time in the future.',
    ru: 'Выберите время в будущем.',
    cz: 'Vyberte čas v budoucnosti.',
  },
  'bookingManage.status.planned': { en: 'Planned', ru: 'Запланирован', cz: 'Naplánováno' },
  'bookingManage.status.completed': { en: 'Completed', ru: 'Завершён', cz: 'Dokončeno' },
  'bookingManage.status.cancelled': { en: 'Cancelled', ru: 'Отменён', cz: 'Zrušeno' },
  'bookingManage.status.in_progress': { en: 'In progress', ru: 'Идёт', cz: 'Probíhá' },

  'notifications.title': { en: 'Notifications', ru: 'Уведомления', cz: 'Oznámení' },
  'notifications.description': {
    en: 'Email messages to clients about bookings and the reminder before a visit.',
    ru: 'Письма клиентам о записи и напоминание перед визитом.',
    cz: 'E-maily klientům o rezervaci a připomínka před návštěvou.',
  },
  'notifications.noAccess': {
    en: 'You do not have access to notification settings.',
    ru: 'У вас нет доступа к настройкам уведомлений.',
    cz: 'K nastavení oznámení nemáte přístup.',
  },
  'notifications.businessRequired': {
    en: 'Notifications need a business.',
    ru: 'Для уведомлений нужен бизнес.',
    cz: 'Oznámení vyžadují podnik.',
  },
  'notifications.providerReady': {
    en: 'Email provider is connected',
    ru: 'Провайдер email подключён',
    cz: 'Poskytovatel e-mailu je připojen',
  },
  'notifications.providerNotReady': {
    en: 'Email provider is not connected',
    ru: 'Провайдер email не подключён',
    cz: 'Poskytovatel e-mailu není připojen',
  },
  'notifications.providerNotReadyHint': {
    en: 'The server has no SMTP settings, so notifications cannot be enabled. Ask the administrator to connect the provider; the test below stays local.',
    ru: 'На сервере не заданы настройки SMTP, поэтому уведомления нельзя включить. Попросите администратора подключить провайдера; тест ниже остаётся локальным.',
    cz: 'Server nemá nastavení SMTP, proto oznámení nelze zapnout. Požádejte správce o připojení poskytovatele; test níže zůstává lokální.',
  },
  'notifications.channel': { en: 'Channel', ru: 'Канал', cz: 'Kanál' },
  'notifications.channelHint': {
    en: 'Email is the only channel available in this version.',
    ru: 'В этой версии доступен только email.',
    cz: 'V této verzi je dostupný pouze e-mail.',
  },
  'notifications.channelNotConnected': {
    en: 'not connected',
    ru: 'не подключён',
    cz: 'nepřipojeno',
  },
  'notifications.enabled': {
    en: 'Send notifications to clients',
    ru: 'Отправлять уведомления клиентам',
    cz: 'Odesílat oznámení klientům',
  },
  'notifications.enabledHint': {
    en: 'Messages about created, changed and cancelled bookings, plus the reminder.',
    ru: 'Письма о создании, переносе и отмене записи, а также напоминание.',
    cz: 'Zprávy o vytvoření, změně a zrušení rezervace a připomínka.',
  },
  'notifications.enable': { en: 'Enable', ru: 'Включить', cz: 'Zapnout' },
  'notifications.disable': { en: 'Disable', ru: 'Выключить', cz: 'Vypnout' },
  'notifications.reminderTime': { en: 'Reminder time', ru: 'Время напоминания', cz: 'Čas připomínky' },
  'notifications.reminderTimeHint': {
    en: 'Local time on the day before the visit.',
    ru: 'Местное время за день до визита.',
    cz: 'Místní čas den před návštěvou.',
  },
  'notifications.timezone': { en: 'Business timezone', ru: 'Часовой пояс бизнеса', cz: 'Časové pásmo podniku' },
  'notifications.saved': { en: 'Settings saved.', ru: 'Настройки сохранены.', cz: 'Nastavení uloženo.' },
  'notifications.saveError': {
    en: 'Could not save notification settings.',
    ru: 'Не удалось сохранить настройки уведомлений.',
    cz: 'Nastavení oznámení se nepodařilo uložit.',
  },
  'notifications.testTitle': { en: 'Test delivery', ru: 'Тестовая доставка', cz: 'Testovací doručení' },
  'notifications.testDescription': {
    en: 'The button uses the local capture transport: it shows what would be sent and never contacts a provider.',
    ru: 'Кнопка использует локальный capture-транспорт: показывает, что было бы отправлено, и не обращается к провайдеру.',
    cz: 'Tlačítko používá lokální capture transport: ukáže, co by se odeslalo, a nikdy nekontaktuje poskytovatele.',
  },
  'notifications.testRun': { en: 'Run test', ru: 'Проверить', cz: 'Otestovat' },
  'notifications.testRunning': { en: 'Testing...', ru: 'Проверка...', cz: 'Testování...' },
  'notifications.testCaptured': {
    en: 'Captured locally — not sent',
    ru: 'Перехвачено локально — не отправлено',
    cz: 'Zachyceno lokálně — neodesláno',
  },
  'notifications.testStatus': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'notifications.testProvider': { en: 'Transport', ru: 'Транспорт', cz: 'Transport' },
  'notifications.testRecipient': { en: 'Recipient', ru: 'Получатель', cz: 'Příjemce' },
  'notifications.testSubject': { en: 'Subject', ru: 'Тема', cz: 'Předmět' },
  'notifications.testPreview': { en: 'Preview', ru: 'Предпросмотр', cz: 'Náhled' },
  'notifications.testError': {
    en: 'Could not run the test.',
    ru: 'Не удалось выполнить проверку.',
    cz: 'Test se nepodařilo spustit.',
  },
  'notifications.delivery.title': { en: 'Delivery log', ru: 'Журнал доставки', cz: 'Protokol doručení' },
  'notifications.delivery.description': {
    en: 'Recent messages and provider errors for this business.',
    ru: 'Последние сообщения и ошибки провайдера по этому бизнесу.',
    cz: 'Nedávné zprávy a chyby poskytovatele pro tento podnik.',
  },
  'notifications.delivery.empty': {
    en: 'No deliveries yet.',
    ru: 'Доставок пока нет.',
    cz: 'Zatím žádná doručení.',
  },
  'notifications.delivery.recipient': { en: 'Recipient', ru: 'Получатель', cz: 'Příjemce' },
  'notifications.delivery.attempts': { en: 'Attempts', ru: 'Попытки', cz: 'Pokusy' },
  'notifications.delivery.error': { en: 'Error', ru: 'Ошибка', cz: 'Chyba' },
  'notifications.delivery.retry': { en: 'Retry', ru: 'Повторить', cz: 'Zopakovat' },
  'notifications.delivery.retrying': { en: 'Retrying...', ru: 'Повтор...', cz: 'Opakování...' },
  'notifications.delivery.retryQueued': {
    en: 'Retry queued. The worker will try again.',
    ru: 'Повтор поставлен в очередь. Worker попробует снова.',
    cz: 'Opakování zařazeno do fronty. Worker se pokusí znovu.',
  },
  'notifications.delivery.retryError': {
    en: 'Could not retry this delivery.',
    ru: 'Не удалось повторить эту доставку.',
    cz: 'Toto doručení se nepodařilo zopakovat.',
  },
  'notifications.delivery.statusFilter': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'notifications.delivery.allStatuses': { en: 'All statuses', ru: 'Все статусы', cz: 'Všechny stavy' },
  'notifications.delivery.page': { en: 'Page', ru: 'Страница', cz: 'Strana' },
  'notifications.delivery.previous': { en: 'Previous', ru: 'Назад', cz: 'Předchozí' },
  'notifications.delivery.next': { en: 'Next', ru: 'Вперёд', cz: 'Další' },
  'notifications.delivery.loadError': {
    en: 'Could not load the delivery log.',
    ru: 'Не удалось загрузить журнал доставки.',
    cz: 'Protokol doručení se nepodařilo načíst.',
  },
  'notifications.delivery.kind.created': {
    en: 'Booking created',
    ru: 'Запись создана',
    cz: 'Rezervace vytvořena',
  },
  'notifications.delivery.kind.changed': {
    en: 'Booking changed',
    ru: 'Запись перенесена',
    cz: 'Rezervace změněna',
  },
  'notifications.delivery.kind.cancelled': {
    en: 'Booking cancelled',
    ru: 'Запись отменена',
    cz: 'Rezervace zrušena',
  },
  'notifications.delivery.kind.reminder': {
    en: 'Reminder',
    ru: 'Напоминание',
    cz: 'Připomínka',
  },
  'notifications.delivery.status.pending': { en: 'Pending', ru: 'В очереди', cz: 'Čeká' },
  'notifications.delivery.status.processing': { en: 'Sending', ru: 'Отправляется', cz: 'Odesílá se' },
  'notifications.delivery.status.sent': { en: 'Sent', ru: 'Отправлено', cz: 'Odesláno' },
  'notifications.delivery.status.captured': {
    en: 'Captured (not sent)',
    ru: 'Перехвачено (не отправлено)',
    cz: 'Zachyceno (neodesláno)',
  },
  'notifications.delivery.status.skipped': { en: 'Skipped', ru: 'Пропущено', cz: 'Přeskočeno' },
  'notifications.delivery.status.failed': { en: 'Failed', ru: 'Ошибка', cz: 'Selhalo' },
  'notifications.delivery.status.cancelled': { en: 'Cancelled', ru: 'Отменено', cz: 'Zrušeno' },

  'questionnairePage.title': { en: 'Questionnaire', ru: 'Анкета', cz: 'Dotazník' },
  'questionnairePage.linkUnavailableTitle': {
    en: 'This link is unavailable',
    ru: 'Эта ссылка недоступна',
    cz: 'Tento odkaz není dostupný',
  },
  'questionnairePage.linkUnavailableText': {
    en: 'The link may have expired or already been used. Ask the business for a new one.',
    ru: 'Ссылка могла устареть или уже использоваться. Попросите салон прислать новую.',
    cz: 'Odkaz mohl vypršet nebo už byl použit. Požádejte firmu o nový.',
  },
  'questionnairePage.version': { en: 'Version', ru: 'Версия', cz: 'Verze' },
  'questionnairePage.validUntil': { en: 'Valid until', ru: 'Действует до', cz: 'Platný do' },
  'questionnairePage.draftHint': {
    en: 'Answers are kept in this browser tab until you send them.',
    ru: 'Ответы сохраняются в этой вкладке браузера до отправки.',
    cz: 'Odpovědi se v této kartě prohlížeče ukládají do odeslání.',
  },
  'questionnairePage.required': { en: 'Required', ru: 'Обязательный', cz: 'Povinné' },
  'questionnairePage.yes': { en: 'Yes', ru: 'Да', cz: 'Ano' },
  'questionnairePage.no': { en: 'No', ru: 'Нет', cz: 'Ne' },
  'questionnairePage.maxSelected': { en: 'Choose no more than', ru: 'Выберите не более', cz: 'Vyberte nejvýše' },
  'questionnairePage.textPlaceholder': { en: 'Your answer', ru: 'Ваш ответ', cz: 'Vaše odpověď' },
  'questionnairePage.submit': { en: 'Send answers', ru: 'Отправить ответы', cz: 'Odeslat odpovědi' },
  'questionnairePage.submitting': { en: 'Sending...', ru: 'Отправка...', cz: 'Odesílání...' },
  'questionnairePage.submitError': {
    en: 'Could not send the answers.',
    ru: 'Не удалось отправить ответы.',
    cz: 'Odpovědi se nepodařilo odeslat.',
  },
  'questionnairePage.checkAnswers': {
    en: 'Check the marked answers.',
    ru: 'Проверьте отмеченные ответы.',
    cz: 'Zkontrolujte označené odpovědi.',
  },
  'questionnairePage.savedTitle': { en: 'Thank you', ru: 'Спасибо', cz: 'Děkujeme' },
  'questionnairePage.savedText': {
    en: 'Your answers were sent to the business.',
    ru: 'Ваши ответы отправлены салону.',
    cz: 'Vaše odpovědi byly firmě odeslány.',
  },
  'questionnairePage.alreadySubmittedTitle': { en: 'Already submitted', ru: 'Уже отправлено', cz: 'Již odesláno' },
  'questionnairePage.alreadySubmittedText': {
    en: 'This questionnaire has already been answered. You can close this page.',
    ru: 'Эта анкета уже заполнена. Страницу можно закрыть.',
    cz: 'Tento dotazník už byl vyplněn. Stránku můžete zavřít.',
  },
  'questionnairePage.sentAt': { en: 'Sent', ru: 'Отправлено', cz: 'Odesláno' },
  'questionnairePage.error.required': {
    en: 'Answer this question.',
    ru: 'Ответьте на этот вопрос.',
    cz: 'Odpovězte na tuto otázku.',
  },
  'questionnairePage.error.tooLong': {
    en: 'The answer is too long.',
    ru: 'Ответ слишком длинный.',
    cz: 'Odpověď je příliš dlouhá.',
  },
  'questionnairePage.error.invalidText': {
    en: 'Use plain text without control characters.',
    ru: 'Используйте обычный текст без управляющих символов.',
    cz: 'Použijte prostý text bez řídicích znaků.',
  },
  'questionnairePage.error.expectedText': { en: 'Enter text.', ru: 'Введите текст.', cz: 'Zadejte text.' },
  'questionnairePage.error.invalidOption': {
    en: 'Choose one of the offered options.',
    ru: 'Выберите один из предложенных вариантов.',
    cz: 'Vyberte jednu z nabízených možností.',
  },
  'questionnairePage.error.tooMany': {
    en: 'Too many options selected.',
    ru: 'Выбрано слишком много вариантов.',
    cz: 'Vybráno příliš mnoho možností.',
  },
  'questionnairePage.error.duplicate': {
    en: 'The same option is selected twice.',
    ru: 'Один вариант выбран дважды.',
    cz: 'Stejná možnost je vybrána dvakrát.',
  },
  'questionnairePage.error.expectedBoolean': {
    en: 'Choose yes or no.',
    ru: 'Выберите «да» или «нет».',
    cz: 'Vyberte ano nebo ne.',
  },
  'questionnairePage.error.tooLarge': {
    en: 'The answers are too long.',
    ru: 'Ответы слишком длинные.',
    cz: 'Odpovědi jsou příliš dlouhé.',
  },
  'questionnairePage.error.unexpected': {
    en: 'This answer format is not supported.',
    ru: 'Этот формат ответа не поддерживается.',
    cz: 'Tento formát odpovědi není podporován.',
  },
  'questionnairePage.error.generic': {
    en: 'Check this answer.',
    ru: 'Проверьте этот ответ.',
    cz: 'Zkontrolujte tuto odpověď.',
  },

  'questionnaireAnswers.title': { en: 'Questionnaire', ru: 'Анкета', cz: 'Dotazník' },
  'questionnaireAnswers.version': { en: 'Version', ru: 'Версия', cz: 'Verze' },
  'questionnaireAnswers.submittedAt': { en: 'Completed', ru: 'Заполнена', cz: 'Vyplněno' },
  'questionnaireAnswers.noAccess': {
    en: 'You do not have access to this questionnaire.',
    ru: 'Нет доступа к этой анкете.',
    cz: 'K tomuto dotazníku nemáte přístup.',
  },
  'questionnaireAnswers.loadError': {
    en: 'Could not load the questionnaire answers.',
    ru: 'Не удалось загрузить ответы анкеты.',
    cz: 'Odpovědi z dotazníku se nepodařilo načíst.',
  },

  'gift.tab': { en: 'Gift certificates', ru: 'Подарочные сертификаты', cz: 'Dárkové certifikáty' },
  'gift.offersTitle': { en: 'Gift offers', ru: 'Подарочные предложения', cz: 'Dárkové nabídky' },
  'gift.offersSubtitle': {
    en: 'Sell money certificates and visit packages through your public gift shop.',
    ru: 'Продавайте денежные сертификаты и пакеты визитов через публичный подарочный магазин.',
    cz: 'Prodávejte peněžní certifikáty a balíčky návštěv přes veřejný dárkový obchod.',
  },
  'gift.addOffer': { en: 'Add offer', ru: 'Добавить предложение', cz: 'Přidat nabídku' },
  'gift.editOffer': { en: 'Edit offer', ru: 'Изменить предложение', cz: 'Upravit nabídku' },
  'gift.name': { en: 'Name', ru: 'Название', cz: 'Název' },
  'gift.description': { en: 'Description', ru: 'Описание', cz: 'Popis' },
  'gift.kind': { en: 'Type', ru: 'Тип', cz: 'Typ' },
  'gift.kindMoney': { en: 'Money certificate', ru: 'Денежный сертификат', cz: 'Peněžní certifikát' },
  'gift.kindPackage': { en: 'Visit package', ru: 'Пакет визитов', cz: 'Balíček návštěv' },
  'gift.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'gift.faceValue': { en: 'Face value', ru: 'Номинал', cz: 'Nominální hodnota' },
  'gift.visitsCount': { en: 'Visits', ru: 'Визиты', cz: 'Návštěvy' },
  'gift.validityDays': { en: 'Valid for, days', ru: 'Срок действия, дней', cz: 'Platnost, dní' },
  'gift.services': { en: 'Applicable services', ru: 'Доступные услуги', cz: 'Platné služby' },
  'gift.allServices': { en: 'All services', ru: 'Все услуги', cz: 'Všechny služby' },
  'gift.active': { en: 'On sale', ru: 'В продаже', cz: 'V prodeji' },
  'gift.inactive': { en: 'Hidden', ru: 'Скрыто', cz: 'Skryto' },
  'gift.save': { en: 'Save', ru: 'Сохранить', cz: 'Uložit' },
  'gift.saveError': {
    en: 'Could not save the offer.',
    ru: 'Не удалось сохранить предложение.',
    cz: 'Nabídku se nepodařilo uložit.',
  },
  'gift.saved': { en: 'Offer saved', ru: 'Предложение сохранено', cz: 'Nabídka uložena' },
  'gift.noOffers': {
    en: 'No gift offers yet. Add the first one.',
    ru: 'Подарочных предложений пока нет. Добавьте первое.',
    cz: 'Zatím žádné dárkové nabídky. Přidejte první.',
  },
  'gift.publicLink': { en: 'Public gift shop', ru: 'Публичный магазин подарков', cz: 'Veřejný dárkový obchod' },
  'gift.publicLinkHint': {
    en: 'Share this link with clients so they can buy certificates online.',
    ru: 'Поделитесь ссылкой с клиентами, чтобы они могли купить сертификат онлайн.',
    cz: 'Sdílejte odkaz s klienty, aby si mohli certifikát koupit online.',
  },
  'gift.needSlug': {
    en: 'Set up public booking first to get a shop link.',
    ru: 'Сначала настройте публичную запись, чтобы получить ссылку на магазин.',
    cz: 'Nejprve nastavte veřejnou rezervaci, abyste získali odkaz na obchod.',
  },
  'gift.copy': { en: 'Copy link', ru: 'Копировать ссылку', cz: 'Kopírovat odkaz' },
  'gift.copied': { en: 'Copied', ru: 'Скопировано', cz: 'Zkopírováno' },
  'gift.shopTitle': { en: 'Gift certificates', ru: 'Подарочные сертификаты', cz: 'Dárkové certifikáty' },
  'gift.shopSubtitle': {
    en: 'Give a certificate for a visit or a whole course of care.',
    ru: 'Подарите сертификат на один визит или целый курс ухода.',
    cz: 'Darujte certifikát na jednu návštěvu nebo celý kurz péče.',
  },
  'gift.buy': { en: 'Buy', ru: 'Купить', cz: 'Koupit' },
  'gift.paymentsUnavailable': {
    en: 'Online payment is not set up yet. Please contact the salon.',
    ru: 'Онлайн-оплата пока не настроена. Пожалуйста, свяжитесь с салоном.',
    cz: 'Online platba zatím není nastavena. Kontaktujte prosím salon.',
  },
  'gift.noOffersPublic': {
    en: 'No certificates on sale right now.',
    ru: 'Сейчас сертификаты не продаются.',
    cz: 'Momentálně nejsou certifikáty v prodeji.',
  },
  'gift.buyerName': { en: 'Your name', ru: 'Ваше имя', cz: 'Vaše jméno' },
  'gift.buyerEmail': { en: 'Your email', ru: 'Ваш email', cz: 'Váš email' },
  'gift.recipientName': { en: 'Recipient name', ru: 'Имя получателя', cz: 'Jméno obdarovaného' },
  'gift.recipientEmail': { en: 'Recipient email', ru: 'Email получателя', cz: 'Email obdarovaného' },
  'gift.message': { en: 'Message', ru: 'Сообщение', cz: 'Zpráva' },
  'gift.consent': {
    en: 'I agree to the processing of my personal data for this purchase.',
    ru: 'Согласен на обработку персональных данных для этой покупки.',
    cz: 'Souhlasím se zpracováním osobních údajů pro tento nákup.',
  },
  'gift.continue': { en: 'Continue to payment', ru: 'Перейти к оплате', cz: 'Pokračovat k platbě' },
  'gift.purchaseError': {
    en: 'Could not create the order.',
    ru: 'Не удалось создать заказ.',
    cz: 'Objednávku se nepodařilo vytvořit.',
  },
  'gift.checkoutTitle': { en: 'Gift payment', ru: 'Оплата сертификата', cz: 'Platba certifikátu' },
  'gift.checkoutText': {
    en: 'This is a sandbox payment. Confirm to complete the purchase.',
    ru: 'Это тестовая оплата. Подтвердите, чтобы завершить покупку.',
    cz: 'Toto je testovací platba. Potvrďte dokončení nákupu.',
  },
  'gift.pay': { en: 'Confirm payment', ru: 'Подтвердить оплату', cz: 'Potvrdit platbu' },
  'gift.fail': { en: 'Decline payment', ru: 'Отклонить оплату', cz: 'Zamítnout platbu' },
  'gift.alreadySettled': {
    en: 'This payment is already settled.',
    ru: 'Эта оплата уже обработана.',
    cz: 'Tato platba je již vyřízena.',
  },
  'gift.returnTitle': { en: 'Gift order', ru: 'Заказ сертификата', cz: 'Objednávka certifikátu' },
  'gift.paidTitle': { en: 'Certificate issued', ru: 'Сертификат выпущен', cz: 'Certifikát vystaven' },
  'gift.paidText': {
    en: 'We issued the certificate and linked it to this page. Keep the link.',
    ru: 'Сертификат выпущен и привязан к этой странице. Сохраните ссылку.',
    cz: 'Certifikát byl vystaven a propojen s touto stránkou. Uložte si odkaz.',
  },
  'gift.pendingTitle': { en: 'Waiting for payment', ru: 'Ожидаем оплату', cz: 'Čeká se na platbu' },
  'gift.pendingText': {
    en: 'The payment has not arrived yet. Check again in a moment.',
    ru: 'Оплата ещё не поступила. Проверьте через минуту.',
    cz: 'Platba zatím nedorazila. Zkontrolujte za chvíli.',
  },
  'gift.failedTitle': { en: 'Payment failed', ru: 'Оплата не прошла', cz: 'Platba selhala' },
  'gift.failedText': {
    en: 'The certificate was not issued. Return to the shop to try again.',
    ru: 'Сертификат не выпущен. Вернитесь в магазин и попробуйте снова.',
    cz: 'Certifikát nebyl vystaven. Vraťte se do obchodu a zkuste to znovu.',
  },
  'gift.expiredTitle': { en: 'Order expired', ru: 'Заказ истёк', cz: 'Objednávka vypršela' },
  'gift.expiredText': {
    en: 'The payment window closed. Start a new purchase.',
    ru: 'Время на оплату истекло. Оформите покупку заново.',
    cz: 'Čas na platbu vypršel. Vytvořte novou objednávku.',
  },
  'gift.reconcileTitle': { en: 'Checking payment', ru: 'Проверяем оплату', cz: 'Kontrola platby' },
  'gift.reconcileText': {
    en: 'The provider has not answered yet. Refresh the status in a moment.',
    ru: 'Провайдер ещё не ответил. Обновите статус через минуту.',
    cz: 'Poskytovatel zatím neodpověděl. Obnovte stav za chvíli.',
  },
  'gift.code': { en: 'Certificate code', ru: 'Код сертификата', cz: 'Kód certifikátu' },
  'gift.codeHint': {
    en: 'Enter the code from the certificate. The current balance is calculated automatically.',
    ru: 'Введите код с сертификата. Текущий баланс рассчитывается автоматически.',
    cz: 'Zadejte kód z certifikátu. Aktuální zůstatek se vypočítá automaticky.',
  },
  'gift.balance': { en: 'Balance', ru: 'Баланс', cz: 'Zůstatek' },
  'gift.visitsLeft': { en: 'Visits left', ru: 'Осталось визитов', cz: 'Zbývá návštěv' },
  'gift.validUntil': { en: 'Valid until', ru: 'Действует до', cz: 'Platí do' },
  'gift.invalidLink': {
    en: 'This link is not valid. Ask the salon for a new one.',
    ru: 'Ссылка недействительна. Попросите салон прислать новую.',
    cz: 'Tento odkaz není platný. Požádejte salon o nový.',
  },
  'gift.loadError': {
    en: 'Could not load the gift data.',
    ru: 'Не удалось загрузить данные сертификата.',
    cz: 'Dárková data se nepodařilo načíst.',
  },
  'gift.checkAgain': { en: 'Check again', ru: 'Проверить снова', cz: 'Zkontrolovat znovu' },
  'gift.amountToUse': { en: 'Amount to use', ru: 'Сумма к списанию', cz: 'Částka k čerpání' },
  'gift.amountHint': {
    en: 'Leave empty to apply the maximum available for this visit.',
    ru: 'Оставьте пустым, чтобы списать максимум, доступный для этого визита.',
    cz: 'Nechte prázdné pro maximální částku dostupnou pro tuto návštěvu.',
  },
  'gift.useGift': { en: 'Apply gift certificate', ru: 'Применить сертификат', cz: 'Použít certifikát' },
  'gift.lookup': { en: 'Find', ru: 'Найти', cz: 'Najít' },
  'gift.lookupHint': {
    en: 'Find a certificate by its code.',
    ru: 'Найдите сертификат по коду.',
    cz: 'Najděte certifikát podle kódu.',
  },
  'gift.notFound': {
    en: 'No certificate found for this code.',
    ru: 'Сертификат с таким кодом не найден.',
    cz: 'Certifikát s tímto kódem nebyl nalezen.',
  },
  'gift.applyError': {
    en: 'Could not apply the certificate.',
    ru: 'Не удалось применить сертификат.',
    cz: 'Certifikát se nepodařilo použít.',
  },
  'gift.remove': { en: 'Remove', ru: 'Убрать', cz: 'Odebrat' },
  'gift.loyaltyDisabled': {
    en: 'Loyalty points cannot be combined with a gift certificate.',
    ru: 'Баллы лояльности нельзя сочетать с подарочным сертификатом.',
    cz: 'Věrnostní body nelze kombinovat s dárkovým certifikátem.',
  },
  'gift.savedGiftWarning': {
    en: 'The visit was saved, but the certificate was not applied.',
    ru: 'Визит сохранён, но сертификат не применён.',
    cz: 'Návštěva byla uložena, ale certifikát nebyl použit.',
  },
  'gift.forService': { en: 'For service', ru: 'На услугу', cz: 'Na službu' },
  'gift.anyService': { en: 'Any service', ru: 'Любая услуга', cz: 'Libovolná služba' },
  'gift.visitsUnit': { en: 'visits', ru: 'визитов', cz: 'návštěv' },
  'gift.issuedBy': { en: 'Issued by', ru: 'Кем выпущен', cz: 'Vystavil' },
  'gift.recipient': { en: 'Recipient', ru: 'Получатель', cz: 'Příjemce' },
  'gift.status.active': { en: 'Active', ru: 'Активен', cz: 'Aktivní' },
  'gift.status.exhausted': { en: 'Used up', ru: 'Использован', cz: 'Vyčerpán' },
  'gift.status.expired': { en: 'Expired', ru: 'Истёк', cz: 'Vypršel' },
  'gift.status.cancelled': { en: 'Cancelled', ru: 'Отменён', cz: 'Zrušen' },
  'gift.certificatesTitle': {
    en: 'Issued certificates',
    ru: 'Выпущенные сертификаты',
    cz: 'Vystavené certifikáty',
  },
  'gift.certificatesSubtitle': {
    en: 'Balances are calculated from the ledger and cannot be edited by hand.',
    ru: 'Балансы рассчитываются по журналу и не редактируются вручную.',
    cz: 'Zůstatky se počítají z deníku a nelze je ručně upravovat.',
  },
  'gift.noCertificates': {
    en: 'No certificates yet.',
    ru: 'Сертификатов пока нет.',
    cz: 'Zatím žádné certifikáty.',
  },
  'gift.details': { en: 'Details', ru: 'Подробнее', cz: 'Podrobnosti' },
  'gift.close': { en: 'Close', ru: 'Закрыть', cz: 'Zavřít' },
  'gift.reverse': { en: 'Reverse redemption', ru: 'Отменить списание', cz: 'Vrátit čerpání' },
  'gift.reverseConfirm': {
    en: 'Return this redemption to the certificate balance?',
    ru: 'Вернуть это списание на баланс сертификата?',
    cz: 'Vrátit toto čerpání na zůstatek certifikátu?',
  },
  'gift.reverseError': {
    en: 'Could not reverse the redemption.',
    ru: 'Не удалось отменить списание.',
    cz: 'Čerpání se nepodařilo vrátit.',
  },
  'gift.reverseDone': { en: 'Redemption reversed', ru: 'Списание отменено', cz: 'Čerpání vráceno' },
  'gift.ledger': { en: 'Ledger', ru: 'Журнал операций', cz: 'Deník operací' },
  'gift.ledger.issued': { en: 'Issued', ru: 'Выпуск', cz: 'Vystavení' },
  'gift.ledger.redeemed': { en: 'Redeemed', ru: 'Списание', cz: 'Čerpání' },
  'gift.ledger.reversed': { en: 'Reversed', ru: 'Возврат', cz: 'Vrácení' },
  'gift.ledger.expired': { en: 'Expired', ru: 'Истечение', cz: 'Vypršení' },
  'gift.remaining': { en: 'Remaining', ru: 'Остаток', cz: 'Zbývá' },
  'gift.visit': { en: 'Visit', ru: 'Визит', cz: 'Návštěva' },
  'gift.buyer': { en: 'Buyer', ru: 'Покупатель', cz: 'Kupující' },
  'gift.statusFilter.all': { en: 'All statuses', ru: 'Все статусы', cz: 'Všechny stavy' },
  'gift.servicesHint': {
    en: 'With no services selected the certificate works for every service.',
    ru: 'Если услуги не выбраны, сертификат действует на все услуги.',
    cz: 'Pokud nejsou vybrány služby, certifikát platí na všechny služby.',
  },
  'gift.payBefore': { en: 'Pay before', ru: 'Оплатить до', cz: 'Zaplatit do' },
  'gift.sandboxBadge': { en: 'Sandbox', ru: 'Тестовый режим', cz: 'Testovací režim' },
  'gift.amountTooHigh': {
    en: 'The amount is higher than the available balance.',
    ru: 'Сумма больше доступного баланса.',
    cz: 'Částka je vyšší než dostupný zůstatek.',
  },
  'gift.scopeMismatch': {
    en: 'This certificate does not cover the services of this visit.',
    ru: 'Этот сертификат не покрывает услуги этого визита.',
    cz: 'Tento certifikát nepokrývá služby této návštěvy.',
  },
  'gift.amountDue': { en: 'Due after the certificate', ru: 'К оплате после сертификата', cz: 'K úhradě po certifikátu' },
  'gift.unusable': {
    en: 'This certificate cannot be used.',
    ru: 'Этот сертификат нельзя использовать.',
    cz: 'Tento certifikát nelze použít.',
  },

  'nav.campaigns': { en: 'Campaigns', ru: 'Рассылки', cz: 'Kampaně' },
  'campaigns.title': { en: 'Campaigns', ru: 'Рассылки', cz: 'Kampaně' },
  'campaigns.description': {
    en: 'Email campaigns to clients who explicitly agreed to marketing. Nothing is sent until you confirm the audience and the text.',
    ru: 'Email-рассылки клиентам, которые явно согласились на маркетинг. Ничего не отправляется, пока вы не подтвердите аудиторию и текст.',
    cz: 'E-mailové kampaně klientům, kteří výslovně souhlasili s marketingem. Nic se neodešle, dokud nepotvrdíte publikum a text.',
  },
  'campaigns.noAccess': {
    en: 'You do not have access to campaigns.',
    ru: 'У вас нет доступа к рассылкам.',
    cz: 'K kampaním nemáte přístup.',
  },
  'campaigns.empty': {
    en: 'No campaigns yet. Save a draft to see who would receive it.',
    ru: 'Рассылок пока нет. Сохраните черновик, чтобы увидеть получателей.',
    cz: 'Zatím žádné kampaně. Uložte koncept a uvidíte příjemce.',
  },
  'campaigns.selectPrompt': {
    en: 'Select a campaign on the left or create a new one.',
    ru: 'Выберите рассылку слева или создайте новую.',
    cz: 'Vyberte kampaň vlevo nebo vytvořte novou.',
  },
  'campaigns.new': { en: 'New campaign', ru: 'Новая рассылка', cz: 'Nová kampaň' },
  'campaigns.edit': { en: 'Edit', ru: 'Изменить', cz: 'Upravit' },
  'campaigns.editHint': {
    en: 'Editing a confirmed campaign returns it to a draft and requires a new confirmation.',
    ru: 'Изменение подтверждённой рассылки возвращает её в черновик и требует нового подтверждения.',
    cz: 'Úprava potvrzené kampaně vrátí kampaň do konceptu a vyžaduje nové potvrzení.',
  },
  'campaigns.name': { en: 'Campaign name', ru: 'Название рассылки', cz: 'Název kampaně' },
  'campaigns.subject': { en: 'Email subject', ru: 'Тема письма', cz: 'Předmět e-mailu' },
  'campaigns.body': { en: 'Message text', ru: 'Текст сообщения', cz: 'Text zprávy' },
  'campaigns.bodyHint': {
    en: 'Use {name} for the client name and {business} for your business name.',
    ru: 'Используйте {name} для имени клиента и {business} для названия бизнеса.',
    cz: 'Použijte {name} pro jméno klienta a {business} pro název firmy.',
  },
  'campaigns.inactiveDays': { en: 'No visits for, days', ru: 'Нет визитов, дней', cz: 'Bez návštěvy, dní' },
  'campaigns.inactiveDaysHint': {
    en: 'Only clients whose last completed visit (or first appearance in the client list) is older than this period are included.',
    ru: 'Включаются клиенты, у которых последний завершённый визит (или появление в списке клиентов) был раньше этого срока.',
    cz: 'Zahrnuti jsou klienti, jejichž poslední dokončená návštěva (nebo první výskyt v seznamu klientů) je starší než toto období.',
  },
  'campaigns.schedule': { en: 'Send no earlier than', ru: 'Отправить не раньше', cz: 'Odeslat nejdříve' },
  'campaigns.scheduleHint': {
    en: 'Leave empty to queue right after you press Send.',
    ru: 'Оставьте пустым, чтобы поставить в очередь сразу после нажатия «Отправить».',
    cz: 'Ponechte prázdné pro zařazení hned po stisknutí Odeslat.',
  },
  'campaigns.create': { en: 'Save draft', ru: 'Сохранить черновик', cz: 'Uložit koncept' },
  'campaigns.creating': { en: 'Saving...', ru: 'Сохранение...', cz: 'Ukládání...' },
  'campaigns.save': { en: 'Save changes', ru: 'Сохранить изменения', cz: 'Uložit změny' },
  'campaigns.saving': { en: 'Saving...', ru: 'Сохранение...', cz: 'Ukládání...' },
  'campaigns.createError': {
    en: 'Could not save the draft.',
    ru: 'Не удалось сохранить черновик.',
    cz: 'Koncept se nepodařilo uložit.',
  },
  'campaigns.saveError': {
    en: 'Could not save the campaign.',
    ru: 'Не удалось сохранить рассылку.',
    cz: 'Kampaň se nepodařilo uložit.',
  },
  'campaigns.actionError': {
    en: 'Something went wrong. Try again.',
    ru: 'Что-то пошло не так. Повторите попытку.',
    cz: 'Něco se pokazilo. Zkuste to znovu.',
  },
  'campaigns.status.draft': { en: 'Draft', ru: 'Черновик', cz: 'Koncept' },
  'campaigns.status.confirmed': { en: 'Confirmed', ru: 'Подтверждена', cz: 'Potvrzeno' },
  'campaigns.status.sending': { en: 'Sending', ru: 'Отправляется', cz: 'Odesílá se' },
  'campaigns.status.sent': { en: 'Sent', ru: 'Отправлена', cz: 'Odesláno' },
  'campaigns.status.cancelled': { en: 'Cancelled', ru: 'Отменена', cz: 'Zrušeno' },
  'campaigns.segmentTitle': { en: 'Segment', ru: 'Сегмент', cz: 'Segment' },
  'campaigns.audience': { en: 'Audience', ru: 'Аудитория', cz: 'Publikum' },
  'campaigns.audienceLive': {
    en: 'Live audience. It is recalculated until you confirm the campaign.',
    ru: 'Живая аудитория. Пересчитывается до подтверждения рассылки.',
    cz: 'Živé publikum. Přepočítává se do potvrzení kampaně.',
  },
  'campaigns.audienceFrozen': {
    en: 'Audience frozen at confirmation.',
    ru: 'Аудитория зафиксирована при подтверждении.',
    cz: 'Publikum je potvrzením zmrazeno.',
  },
  'campaigns.audiencePending': {
    en: 'Audience is counted at confirmation',
    ru: 'Аудитория подсчитается при подтверждении',
    cz: 'Publikum se spočítá při potvrzení',
  },
  'campaigns.willReceive': { en: 'Will receive: {n}', ru: 'Получат: {n}', cz: 'Obdrží: {n}' },
  'campaigns.queued': { en: 'Queued: {n}', ru: 'В очереди: {n}', cz: 'Ve frontě: {n}' },
  'campaigns.sampleHint': {
    en: 'Showing up to {n} masked addresses.',
    ru: 'Показаны до {n} адресов в маскированном виде.',
    cz: 'Zobrazeno až {n} maskovaných adres.',
  },
  'campaigns.noRecipients': {
    en: 'No subscribed clients match this segment.',
    ru: 'В этом сегменте нет клиентов с согласием.',
    cz: 'Tomuto segmentu neodpovídá žádný klient se souhlasem.',
  },
  'campaigns.overLimit': {
    en: 'The audience exceeds the limit of {n} recipients. Narrow the segment.',
    ru: 'Аудитория превышает лимит в {n} получателей. Сузьте сегмент.',
    cz: 'Publikum překračuje limit {n} příjemců. Zúžte segment.',
  },
  'campaigns.sendReady': {
    en: 'Provider connected, notifications enabled, audience confirmed.',
    ru: 'Провайдер подключён, уведомления включены, аудитория подтверждена.',
    cz: 'Poskytovatel připojen, oznámení zapnuta, publikum potvrzeno.',
  },
  'campaigns.providerNotReady': {
    en: 'Email provider is not connected, sending is disabled.',
    ru: 'Email-провайдер не подключён, отправка недоступна.',
    cz: 'E-mailový poskytovatel není připojen, odesílání je vypnuté.',
  },
  'campaigns.notificationsDisabled': {
    en: 'Client notifications are disabled in settings, sending is disabled.',
    ru: 'Уведомления клиентам выключены в настройках, отправка недоступна.',
    cz: 'Oznámení klientům jsou v nastavení vypnutá, odesílání je vypnuté.',
  },
  'campaigns.requiresConfirmation': {
    en: 'Confirm the audience and the text before sending.',
    ru: 'Перед отправкой подтвердите аудиторию и текст.',
    cz: 'Před odesláním potvrďte publikum a text.',
  },
  'campaigns.confirm': {
    en: 'Confirm audience and text',
    ru: 'Подтвердить аудиторию и текст',
    cz: 'Potvrdit publikum a text',
  },
  'campaigns.confirmQuestion': {
    en: 'Freeze this audience and text?',
    ru: 'Зафиксировать эту аудиторию и текст?',
    cz: 'Zmrazit toto publikum a text?',
  },
  'campaigns.confirmHint': {
    en: 'Any later edit returns the campaign to draft. Clients who unsubscribe after confirmation are excluded at sending.',
    ru: 'Любое последующее изменение вернёт рассылку в черновик. Клиенты, отписавшиеся после подтверждения, исключаются при отправке.',
    cz: 'Jakákoli pozdější úprava vrátí kampaň do konceptu. Klienti, kteří se po potvrzení odhlásí, budou při odesílání vynecháni.',
  },
  'campaigns.confirming': { en: 'Confirming...', ru: 'Подтверждение...', cz: 'Potvrzování...' },
  'campaigns.confirmAction': { en: 'Confirm', ru: 'Подтвердить', cz: 'Potvrdit' },
  'campaigns.confirmError': {
    en: 'Could not confirm the campaign.',
    ru: 'Не удалось подтвердить рассылку.',
    cz: 'Kampaň se nepodařilo potvrdit.',
  },
  'campaigns.send': { en: 'Send campaign', ru: 'Отправить рассылку', cz: 'Odeslat kampaň' },
  'campaigns.sendQuestion': {
    en: 'Queue this campaign for the confirmed recipients?',
    ru: 'Поставить рассылку в очередь для подтверждённых получателей?',
    cz: 'Zařadit kampaň do fronty pro potvrzené příjemce?',
  },
  'campaigns.sendHint': {
    en: 'Messages go to the connected email provider through the shared outbox. Nothing is sent before you press this button.',
    ru: 'Письма уходят подключённому email-провайдеру через общую очередь. До нажатия этой кнопки ничего не отправляется.',
    cz: 'E-maily odcházejí připojenému poskytovateli přes společnou frontu. Před stisknutím tohoto tlačítka se nic neodešle.',
  },
  'campaigns.sending': { en: 'Sending...', ru: 'Отправка...', cz: 'Odesílání...' },
  'campaigns.sendAction': { en: 'Send', ru: 'Отправить', cz: 'Odeslat' },
  'campaigns.sendError': {
    en: 'Could not send the campaign.',
    ru: 'Не удалось отправить рассылку.',
    cz: 'Kampaň se nepodařilo odeslat.',
  },
  'campaigns.cancel': { en: 'Cancel campaign', ru: 'Отменить рассылку', cz: 'Zrušit kampaň' },
  'campaigns.cancelQuestion': {
    en: 'Cancel this campaign and stop unsent messages?',
    ru: 'Отменить рассылку и остановить неотправленные письма?',
    cz: 'Zrušit kampaň a zastavit neodeslané zprávy?',
  },
  'campaigns.cancelling': { en: 'Cancelling...', ru: 'Отмена...', cz: 'Rušení...' },
  'campaigns.cancelAction': { en: 'Yes, cancel', ru: 'Да, отменить', cz: 'Ano, zrušit' },
  'campaigns.cancelledNotice': {
    en: 'Campaign cancelled. Unsent messages were stopped.',
    ru: 'Рассылка отменена. Неотправленные письма остановлены.',
    cz: 'Kampaň zrušena. Neodeslané zprávy byly zastaveny.',
  },
  'campaigns.cancelError': {
    en: 'Could not cancel the campaign.',
    ru: 'Не удалось отменить рассылку.',
    cz: 'Kampaň se nepodařilo zrušit.',
  },
  'campaigns.statsTitle': { en: 'Delivery summary', ru: 'Сводка доставки', cz: 'Přehled doručení' },
  'campaigns.stat.audience': { en: 'Audience', ru: 'Аудитория', cz: 'Publikum' },
  'campaigns.stat.queued': { en: 'Queued', ru: 'В очереди', cz: 'Ve frontě' },
  'campaigns.stat.pending': { en: 'Pending', ru: 'Ожидают', cz: 'Čeká' },
  'campaigns.stat.sent': { en: 'Sent', ru: 'Отправлено', cz: 'Odesláno' },
  'campaigns.stat.captured': { en: 'Captured locally', ru: 'Перехвачено локально', cz: 'Zachyceno lokálně' },
  'campaigns.stat.failed': { en: 'Errors', ru: 'Ошибки', cz: 'Chyby' },
  'campaigns.stat.cancelled': { en: 'Cancelled', ru: 'Отменено', cz: 'Zrušeno' },
  'campaigns.stat.unsubscribed': {
    en: 'Unsubscribed after this campaign',
    ru: 'Отписались после рассылки',
    cz: 'Odhlášeno po kampani',
  },
  'campaigns.excluded': {
    en: 'Excluded after confirmation (unsubscribed)',
    ru: 'Исключены после подтверждения (отписка)',
    cz: 'Vynecháni po potvrzení (odhlášeni)',
  },
  'campaigns.noOpens': {
    en: 'Opens and revenue are not tracked, so this summary shows only delivery states.',
    ru: 'Открытия и выручка не отслеживаются, поэтому сводка показывает только состояния доставки.',
    cz: 'Otevření a výnosy se nesledují, přehled proto ukazuje pouze stavy doručení.',
  },
  'campaigns.fullText': { en: 'Full text', ru: 'Полный текст', cz: 'Celý text' },
  'campaigns.locked': {
    en: 'This campaign can no longer be edited or sent.',
    ru: 'Эту рассылку больше нельзя изменить или отправить.',
    cz: 'Tuto kampaň už nelze upravit ani odeslat.',
  },
  'campaigns.previewTitle': { en: 'Preview', ru: 'Предпросмотр', cz: 'Náhled' },
  'campaigns.previewError': {
    en: 'Could not load the preview.',
    ru: 'Не удалось загрузить предпросмотр.',
    cz: 'Náhled se nepodařilo načíst.',
  },
  'unsubscribe.title': { en: 'Email preferences', ru: 'Настройки рассылки', cz: 'Nastavení e-mailů' },
  'unsubscribe.business': { en: 'Business', ru: 'Бизнес', cz: 'Firma' },
  'unsubscribe.address': { en: 'Email address', ru: 'Email-адрес', cz: 'E-mailová adresa' },
  'unsubscribe.subscribed': {
    en: 'This address is subscribed to marketing emails.',
    ru: 'Этот адрес подписан на маркетинговые письма.',
    cz: 'Tato adresa je přihlášena k marketingovým e-mailům.',
  },
  'unsubscribe.unsubscribed': {
    en: 'This address is unsubscribed from marketing emails.',
    ru: 'Этот адрес отписан от маркетинговых писем.',
    cz: 'Tato adresa je odhlášena z marketingových e-mailů.',
  },
  'unsubscribe.action': { en: 'Unsubscribe', ru: 'Отписаться', cz: 'Odhlásit odběr' },
  'unsubscribe.working': { en: 'Unsubscribing...', ru: 'Отписываем...', cz: 'Odhlašování...' },
  'unsubscribe.done': {
    en: 'You are unsubscribed. This address will not receive marketing emails.',
    ru: 'Вы отписаны. Этот адрес больше не будет получать маркетинговые письма.',
    cz: 'Byli jste odhlášeni. Tato adresa už nebude dostávat marketingové e-maily.',
  },
  'unsubscribe.already': {
    en: 'This address is already unsubscribed.',
    ru: 'Этот адрес уже отписан.',
    cz: 'Tato adresa je již odhlášena.',
  },
  'unsubscribe.invalid': {
    en: 'This unsubscribe link is invalid or incomplete.',
    ru: 'Эта ссылка отписки недействительна или неполна.',
    cz: 'Tento odhlašovací odkaz je neplatný nebo neúplný.',
  },
  'unsubscribe.hint': {
    en: 'The change applies immediately. You can close this page.',
    ru: 'Изменение применяется сразу. Страницу можно закрыть.',
    cz: 'Změna platí okamžitě. Stránku můžete zavřít.',
  },
  'unsubscribe.error': {
    en: 'Could not unsubscribe. Try again.',
    ru: 'Не удалось отписаться. Повторите попытку.',
    cz: 'Odhlášení se nezdařilo. Zkuste to znovu.',
  },
  'unsubscribe.missing': {
    en: 'Open the link from the email to manage your subscription.',
    ru: 'Откройте ссылку из письма, чтобы управлять подпиской.',
    cz: 'Otevřete odkaz z e-mailu pro správu odběru.',
  },
  'unsubscribe.loading': { en: 'Checking the link...', ru: 'Проверяем ссылку...', cz: 'Kontrola odkazu...' },
  'unsubscribe.home': { en: 'Go to the website', ru: 'Перейти на сайт', cz: 'Přejít na web' },
  'nav.audit': { en: 'Action log', ru: 'Журнал действий', cz: 'Protokol akcí' },
  'audit.title': { en: 'Action log', ru: 'Журнал действий', cz: 'Protokol akcí' },
  'audit.description': {
    en: 'Who changed what in your business, and when. The log is read-only and never stores personal data, questionnaire answers or payment details.',
    ru: 'Кто, когда и что изменил в вашем бизнесе. Журнал доступен только для чтения и не содержит персональных данных, ответов на опросники и платёжных реквизитов.',
    cz: 'Kdo, kdy a co změnil ve vaší firmě. Protokol je pouze pro čtení a neobsahuje osobní údaje, odpovědi z dotazníků ani platební údaje.',
  },
  'audit.readOnly': { en: 'Read-only history', ru: 'История только для чтения', cz: 'Historie jen pro čtení' },
  'audit.noAccess': {
    en: 'You do not have access to the action log.',
    ru: 'У вас нет доступа к журналу действий.',
    cz: 'K protokolu akcí nemáte přístup.',
  },
  'audit.filters': { en: 'Filters', ru: 'Фильтры', cz: 'Filtry' },
  'audit.action': { en: 'Action', ru: 'Действие', cz: 'Akce' },
  'audit.allActions': { en: 'All actions', ru: 'Все действия', cz: 'Všechny akce' },
  'audit.entity': { en: 'Record type', ru: 'Тип записи', cz: 'Typ záznamu' },
  'audit.allEntities': { en: 'All records', ru: 'Все записи', cz: 'Všechny záznamy' },
  'audit.actor': { en: 'Actor (user ID)', ru: 'Автор (ID пользователя)', cz: 'Autor (ID uživatele)' },
  'audit.actorPlaceholder': { en: 'User ID', ru: 'ID пользователя', cz: 'ID uživatele' },
  'audit.actorInvalid': {
    en: 'Enter a numeric user ID.',
    ru: 'Введите числовой ID пользователя.',
    cz: 'Zadejte číselné ID uživatele.',
  },
  'audit.dateFrom': { en: 'From date', ru: 'С даты', cz: 'Od data' },
  'audit.dateTo': { en: 'To date', ru: 'По дату', cz: 'Do data' },
  'audit.dateRangeInvalid': {
    en: 'The start date is after the end date.',
    ru: 'Дата начала позже даты окончания.',
    cz: 'Datum začátku je po datu konce.',
  },
  'audit.apply': { en: 'Apply', ru: 'Применить', cz: 'Použít' },
  'audit.reset': { en: 'Reset', ru: 'Сбросить', cz: 'Zrušit filtry' },
  'audit.export': { en: 'Export CSV', ru: 'Экспорт CSV', cz: 'Export CSV' },
  'audit.exporting': { en: 'Exporting...', ru: 'Экспортируем...', cz: 'Exportuji...' },
  'audit.exportError': {
    en: 'Could not download the CSV file.',
    ru: 'Не удалось скачать CSV.',
    cz: 'CSV se nepodařilo stáhnout.',
  },
  'audit.empty': {
    en: 'No entries match the selected filters.',
    ru: 'Записей по выбранным фильтрам нет.',
    cz: 'Podle zvolených filtrů nejsou žádné záznamy.',
  },
  'audit.when': { en: 'When', ru: 'Когда', cz: 'Kdy' },
  'audit.who': { en: 'Who', ru: 'Кто', cz: 'Kdo' },
  'audit.what': { en: 'What', ru: 'Что', cz: 'Co' },
  'audit.details': { en: 'Details', ru: 'Детали', cz: 'Podrobnosti' },
  'audit.requestId': { en: 'Request ID', ru: 'ID запроса', cz: 'ID požadavku' },
  'audit.fieldsChanged': { en: 'Changed: {fields}', ru: 'Изменено: {fields}', cz: 'Změněno: {fields}' },
  'audit.createdFields': { en: 'Fields: {fields}', ru: 'Поля: {fields}', cz: 'Pole: {fields}' },
  'audit.noDetails': { en: 'No details', ru: 'Без деталей', cz: 'Bez podrobností' },
  'audit.unknownActor': { en: 'Unknown user', ru: 'Неизвестный пользователь', cz: 'Neznámý uživatel' },
  'audit.role.admin': { en: 'Administrator', ru: 'Администратор', cz: 'Administrátor' },
  'audit.role.businessOwner': { en: 'Business owner', ru: 'Владелец бизнеса', cz: 'Majitel firmy' },
  'audit.role.specialist': { en: 'Specialist', ru: 'Специалист', cz: 'Specialista' },
  'audit.role.employee': { en: 'Employee', ru: 'Сотрудник', cz: 'Zaměstnanec' },
  'audit.role.system': { en: 'System', ru: 'Система', cz: 'Systém' },
  'audit.role.guest': { en: 'Guest', ru: 'Гость', cz: 'Host' },
  'audit.action.visitCreated': { en: 'Visit created', ru: 'Визит создан', cz: 'Návštěva vytvořena' },
  'audit.action.visitUpdated': { en: 'Visit updated', ru: 'Визит изменён', cz: 'Návštěva upravena' },
  'audit.action.visitMoved': { en: 'Visit moved', ru: 'Визит перенесён', cz: 'Návštěva přesunuta' },
  'audit.action.visitCancelled': { en: 'Visit cancelled', ru: 'Визит отменён', cz: 'Návštěva zrušena' },
  'audit.action.paymentPaid': { en: 'Payment received', ru: 'Платёж получен', cz: 'Platba přijata' },
  'audit.action.paymentFailed': { en: 'Payment failed', ru: 'Платёж не прошёл', cz: 'Platba selhala' },
  'audit.action.paymentRefunded': { en: 'Refund issued', ru: 'Возврат выполнен', cz: 'Vrácení provedeno' },
  'audit.action.questionnaireSubmitted': {
    en: 'Questionnaire submitted',
    ru: 'Опросник заполнен',
    cz: 'Dotazník vyplněn',
  },
  'audit.action.clientUpdated': {
    en: 'Client card updated',
    ru: 'Карточка клиента изменена',
    cz: 'Karta klienta upravena',
  },
  'audit.entity.visit': { en: 'Visit', ru: 'Визит', cz: 'Návštěva' },
  'audit.entity.payment': { en: 'Payment', ru: 'Платёж', cz: 'Platba' },
  'audit.entity.questionnaire': { en: 'Questionnaire', ru: 'Опросник', cz: 'Dotazník' },
  'audit.entity.client': { en: 'Client', ru: 'Клиент', cz: 'Klient' },
  'audit.field.status': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'audit.field.dateStart': { en: 'Start', ru: 'Начало', cz: 'Začátek' },
  'audit.field.dateEnd': { en: 'End', ru: 'Окончание', cz: 'Konec' },
  'audit.field.serviceId': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'audit.field.serviceName': { en: 'Service name', ru: 'Название услуги', cz: 'Název služby' },
  'audit.field.specialistId': { en: 'Specialist', ru: 'Специалист', cz: 'Specialista' },
  'audit.field.price': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'audit.field.paymentMethod': { en: 'Payment method', ru: 'Способ оплаты', cz: 'Způsob platby' },
  'audit.field.items': { en: 'Items', ru: 'Позиции', cz: 'Položky' },
  'audit.field.itemsCount': { en: 'Item count', ru: 'Количество позиций', cz: 'Počet položek' },
  'audit.field.fullName': { en: 'Name', ru: 'Имя', cz: 'Jméno' },
  'audit.field.birthDate': { en: 'Birth date', ru: 'Дата рождения', cz: 'Datum narození' },
  'audit.field.gender': { en: 'Gender', ru: 'Пол', cz: 'Pohlaví' },
  'audit.field.contactPhone': { en: 'Phone', ru: 'Телефон', cz: 'Telefon' },
  'audit.field.contactEmail': { en: 'Email', ru: 'Email', cz: 'E-mail' },
  'audit.field.locationLat': { en: 'Latitude', ru: 'Широта', cz: 'Zeměpisná šířka' },
  'audit.field.locationLon': { en: 'Longitude', ru: 'Долгота', cz: 'Zeměpisná délka' },
  'audit.field.language': { en: 'Language', ru: 'Язык', cz: 'Jazyk' },
  'audit.field.amount': { en: 'Amount', ru: 'Сумма', cz: 'Částka' },
  'audit.field.currency': { en: 'Currency', ru: 'Валюта', cz: 'Měna' },
  'audit.field.provider': { en: 'Provider', ru: 'Провайдер', cz: 'Poskytovatel' },
  'audit.field.providerEventId': {
    en: 'Provider event ID',
    ru: 'ID события провайдера',
    cz: 'ID události poskytovatele',
  },
  'audit.field.refundId': { en: 'Refund ID', ru: 'ID возврата', cz: 'ID vrácení' },
  'audit.field.version': { en: 'Version', ru: 'Версия', cz: 'Verze' },
  'audit.field.fieldsCount': { en: 'Field count', ru: 'Количество полей', cz: 'Počet polí' },
  'audit.field.answeredCount': { en: 'Answered count', ru: 'Количество ответов', cz: 'Počet odpovědí' },
  'audit.field.photoUrl': { en: 'Photo', ru: 'Фотография', cz: 'Fotografie' },
  'audit.field.note': { en: 'Note', ru: 'Заметка', cz: 'Poznámka' },
  'nav.import': { en: 'Import', ru: 'Импорт', cz: 'Import' },
  'importWizard.title': {
    en: 'Import clients and visit history',
    ru: 'Импорт клиентов и истории визитов',
    cz: 'Import klientů a historie návštěv',
  },
  'importWizard.description': {
    en: 'Upload a CSV or XLSX file, match its columns and check the read-only preview. The CRM changes only after you confirm.',
    ru: 'Загрузите CSV или XLSX, сопоставьте колонки и проверьте предпросмотр. CRM изменится только после подтверждения.',
    cz: 'Nahrajte CSV nebo XLSX, přiřaďte sloupce a zkontrolujte náhled. CRM se změní až po potvrzení.',
  },
  'importWizard.noAccess': {
    en: 'You do not have access to imports.',
    ru: 'У вас нет доступа к импорту.',
    cz: 'K importu nemáte přístup.',
  },
  'importWizard.uploadTitle': { en: 'Upload a file', ru: 'Загрузка файла', cz: 'Nahrání souboru' },
  'importWizard.uploadHint': {
    en: 'CSV or XLSX up to 10 MB and 5000 rows. The first row must contain column names.',
    ru: 'CSV или XLSX до 10 МБ и 5000 строк. Первая строка должна содержать названия колонок.',
    cz: 'CSV nebo XLSX do 10 MB a 5000 řádků. První řádek musí obsahovat názvy sloupců.',
  },
  'importWizard.selectFile': { en: 'Choose CSV or XLSX', ru: 'Выбрать CSV или XLSX', cz: 'Vybrat CSV nebo XLSX' },
  'importWizard.replaceFile': { en: 'Choose another file', ru: 'Выбрать другой файл', cz: 'Vybrat jiný soubor' },
  'importWizard.upload': { en: 'Upload file', ru: 'Загрузить файл', cz: 'Nahrát soubor' },
  'importWizard.uploading': { en: 'Uploading...', ru: 'Загружаем...', cz: 'Nahrávám...' },
  'importWizard.uploadError': { en: 'Could not upload the file.', ru: 'Не удалось загрузить файл.', cz: 'Soubor se nepodařilo nahrát.' },
  'importWizard.fileTooLarge': { en: 'The file is larger than 10 MB.', ru: 'Файл больше 10 МБ.', cz: 'Soubor je větší než 10 MB.' },
  'importWizard.fileEmpty': { en: 'The file is empty.', ru: 'Файл пуст.', cz: 'Soubor je prázdný.' },
  'importWizard.fileType': { en: 'Choose a CSV or XLSX file.', ru: 'Выберите файл CSV или XLSX.', cz: 'Vyberte soubor CSV nebo XLSX.' },
  'importWizard.recent': { en: 'Recent imports', ru: 'Последние импорты', cz: 'Poslední importy' },
  'importWizard.recentEmpty': { en: 'No imports yet.', ru: 'Импортов пока нет.', cz: 'Zatím žádné importy.' },
  'importWizard.file': { en: 'File', ru: 'Файл', cz: 'Soubor' },
  'importWizard.statusLabel': { en: 'Status', ru: 'Статус', cz: 'Stav' },
  'importWizard.rowsLabel': { en: 'Rows', ru: 'Строк', cz: 'Řádků' },
  'importWizard.createdLabel': { en: 'Created', ru: 'Создано', cz: 'Vytvořeno' },
  'importWizard.open': { en: 'Open', ru: 'Открыть', cz: 'Otevřít' },
  'importWizard.batchNotFound': { en: 'This import was not found.', ru: 'Этот импорт не найден.', cz: 'Tento import nebyl nalezen.' },
  'importWizard.startOver': { en: 'Start a new import', ru: 'Начать новый импорт', cz: 'Začít nový import' },
  'importWizard.refresh': { en: 'Refresh status', ru: 'Обновить статус', cz: 'Obnovit stav' },
  'importWizard.steps': { en: 'Import steps', ru: 'Этапы импорта', cz: 'Kroky importu' },
  'importWizard.step.upload': { en: 'Upload', ru: 'Загрузка', cz: 'Nahrání' },
  'importWizard.step.mapping': { en: 'Columns', ru: 'Колонки', cz: 'Sloupce' },
  'importWizard.step.preview': { en: 'Preview', ru: 'Предпросмотр', cz: 'Náhled' },
  'importWizard.step.result': { en: 'Result', ru: 'Результат', cz: 'Výsledek' },
  'importWizard.mappingTitle': { en: 'Match the file columns', ru: 'Сопоставьте колонки файла', cz: 'Přiřaďte sloupce souboru' },
  'importWizard.mappingHint': {
    en: 'The client name is required. Only matched columns are copied; everything else stays in the file.',
    ru: 'Имя клиента обязательно. Копируются только сопоставленные колонки, остальное остаётся в файле.',
    cz: 'Jméno klienta je povinné. Kopírují se jen přiřazené sloupce, ostatní zůstávají v souboru.',
  },
  'importWizard.clientFields': { en: 'Client fields', ru: 'Поля клиента', cz: 'Pole klienta' },
  'importWizard.visitFields': { en: 'Visit history', ru: 'История визитов', cz: 'Historie návštěv' },
  'importWizard.visitHint': {
    en: 'Optional. Leave the date empty if the file has no visit history.',
    ru: 'Необязательно. Оставьте дату пустой, если истории визитов нет.',
    cz: 'Nepovinné. Pokud soubor historii návštěv nemá, nechte datum prázdné.',
  },
  'importWizard.notImported': { en: 'Do not import', ru: 'Не импортировать', cz: 'Neimportovat' },
  'importWizard.target.fullName': { en: 'Name', ru: 'Имя', cz: 'Jméno' },
  'importWizard.target.phone': { en: 'Phone', ru: 'Телефон', cz: 'Telefon' },
  'importWizard.target.email': { en: 'Email', ru: 'Email', cz: 'E-mail' },
  'importWizard.target.birthDate': { en: 'Birth date', ru: 'Дата рождения', cz: 'Datum narození' },
  'importWizard.target.gender': { en: 'Gender', ru: 'Пол', cz: 'Pohlaví' },
  'importWizard.target.language': { en: 'Language', ru: 'Язык', cz: 'Jazyk' },
  'importWizard.target.visitDate': { en: 'Visit date', ru: 'Дата визита', cz: 'Datum návštěvy' },
  'importWizard.target.visitService': { en: 'Service', ru: 'Услуга', cz: 'Služba' },
  'importWizard.target.visitSpecialist': { en: 'Specialist', ru: 'Специалист', cz: 'Specialista' },
  'importWizard.target.visitPrice': { en: 'Price', ru: 'Цена', cz: 'Cena' },
  'importWizard.target.visitStatus': { en: 'Visit status', ru: 'Статус визита', cz: 'Stav návštěvy' },
  'importWizard.target.visitPaymentMethod': { en: 'Payment method', ru: 'Способ оплаты', cz: 'Způsob platby' },
  'importWizard.duplicatePolicy': {
    en: 'If the phone or email already exists',
    ru: 'Если телефон или email уже существует',
    cz: 'Pokud telefon nebo e-mail již existuje',
  },
  'importWizard.policy.skip': { en: 'Skip the row', ru: 'Пропустить строку', cz: 'Přeskočit řádek' },
  'importWizard.policy.update': { en: 'Update the existing client', ru: 'Обновить существующего клиента', cz: 'Aktualizovat stávajícího klienta' },
  'importWizard.policy.create': { en: 'Create a separate client', ru: 'Создать отдельного клиента', cz: 'Vytvořit samostatného klienta' },
  'importWizard.mappingRequired': {
    en: 'Match the client name column before continuing.',
    ru: 'Сопоставьте колонку с именем клиента.',
    cz: 'Přiřaďte sloupec s jménem klienta.',
  },
  'importWizard.duplicateColumns': {
    en: 'Each file column can be matched only once.',
    ru: 'Каждую колонку файла можно сопоставить только один раз.',
    cz: 'Každý sloupec souboru lze přiřadit jen jednou.',
  },
  'importWizard.buildPreview': { en: 'Build preview', ru: 'Построить предпросмотр', cz: 'Vytvořit náhled' },
  'importWizard.previewing': { en: 'Building preview...', ru: 'Строим предпросмотр...', cz: 'Vytvářím náhled...' },
  'importWizard.saveError': {
    en: 'Could not save the mapping or build the preview.',
    ru: 'Не удалось сохранить сопоставление или построить предпросмотр.',
    cz: 'Přiřazení nebo náhled se nepodařilo uložit.',
  },
  'importWizard.previewTitle': { en: 'Check the preview', ru: 'Проверьте предпросмотр', cz: 'Zkontrolujte náhled' },
  'importWizard.previewHint': {
    en: 'The preview is read-only. Nothing has been imported yet.',
    ru: 'Предпросмотр ничего не записывает: данные ещё не импортированы.',
    cz: 'Náhled je pouze pro čtení. Zatím nebylo nic importováno.',
  },
  'importWizard.valid': { en: 'Valid', ru: 'Корректных', cz: 'Platných' },
  'importWizard.errors': { en: 'Errors', ru: 'Ошибок', cz: 'Chyb' },
  'importWizard.create': { en: 'Create', ru: 'Создать', cz: 'Vytvořit' },
  'importWizard.update': { en: 'Update', ru: 'Обновить', cz: 'Aktualizovat' },
  'importWizard.skip': { en: 'Skip', ru: 'Пропустить', cz: 'Přeskočit' },
  'importWizard.rebuildPreview': { en: 'Rebuild preview', ru: 'Перестроить предпросмотр', cz: 'Obnovit náhled' },
  'importWizard.filterAll': { en: 'All rows', ru: 'Все строки', cz: 'Všechny řádky' },
  'importWizard.filterErrors': { en: 'Errors only', ru: 'Только ошибки', cz: 'Jen chyby' },
  'importWizard.row': { en: 'Row', ru: 'Строка', cz: 'Řádek' },
  'importWizard.actionLabel': { en: 'Action', ru: 'Действие', cz: 'Akce' },
  'importWizard.details': { en: 'Details', ru: 'Детали', cz: 'Podrobnosti' },
  'importWizard.error': { en: 'Error', ru: 'Ошибка', cz: 'Chyba' },
  'importWizard.noRows': { en: 'No rows to show.', ru: 'Нет строк для показа.', cz: 'Žádné řádky k zobrazení.' },
  'importWizard.rowStatus.pending': { en: 'Pending', ru: 'Ожидает', cz: 'Čeká' },
  'importWizard.rowStatus.valid': { en: 'Valid', ru: 'Корректна', cz: 'Platný' },
  'importWizard.rowStatus.error': { en: 'Error', ru: 'Ошибка', cz: 'Chyba' },
  'importWizard.rowStatus.imported': { en: 'Imported', ru: 'Импортирована', cz: 'Importován' },
  'importWizard.rowStatus.skipped': { en: 'Skipped', ru: 'Пропущена', cz: 'Přeskočen' },
  'importWizard.rowStatus.failed': { en: 'Failed', ru: 'Не удалась', cz: 'Selhal' },
  'importWizard.action.create': { en: 'Create', ru: 'Создать', cz: 'Vytvořit' },
  'importWizard.action.update': { en: 'Update', ru: 'Обновить', cz: 'Aktualizovat' },
  'importWizard.action.skip': { en: 'Skip', ru: 'Пропустить', cz: 'Přeskočit' },
  'importWizard.confirmHint': {
    en: 'Confirmation imports exactly this previewed file. A repeated click will not create duplicates.',
    ru: 'Подтверждение импортирует именно этот проверенный файл. Повторное нажатие не создаст дубли.',
    cz: 'Potvrzení importuje právě tento zkontrolovaný soubor. Opakované kliknutí nevytvoří duplicity.',
  },
  'importWizard.confirm': { en: 'Confirm import', ru: 'Подтвердить импорт', cz: 'Potvrdit import' },
  'importWizard.confirming': { en: 'Importing...', ru: 'Импортируем...', cz: 'Importuji...' },
  'importWizard.confirmError': { en: 'Could not import the file.', ru: 'Не удалось выполнить импорт.', cz: 'Import se nepodařilo provést.' },
  'importWizard.outdated': {
    en: 'The file, mapping or duplicate policy changed. Build a new preview.',
    ru: 'Файл, сопоставление или политика дублей изменились. Постройте новый предпросмотр.',
    cz: 'Soubor, přiřazení nebo pravidlo duplicit se změnilo. Vytvořte nový náhled.',
  },
  'importWizard.importingTitle': { en: 'Import paused', ru: 'Импорт приостановлен', cz: 'Import pozastaven' },
  'importWizard.importingHint': {
    en: 'The previous run stopped before finishing. Continue from the last saved row; already imported rows are not repeated.',
    ru: 'Предыдущий запуск прервался. Продолжите с последней сохранённой строки, уже импортированные строки не повторяются.',
    cz: 'Předchozí běh se přerušil. Pokračujte od posledního uloženého řádku, importované řádky se neopakují.',
  },
  'importWizard.lastCheckpoint': { en: 'Last saved row: {row}', ru: 'Последняя сохранённая строка: {row}', cz: 'Poslední uložený řádek: {row}' },
  'importWizard.importedSoFar': { en: 'Created {created}, updated {updated}', ru: 'Создано {created}, обновлено {updated}', cz: 'Vytvořeno {created}, aktualizováno {updated}' },
  'importWizard.continueImport': { en: 'Continue import', ru: 'Продолжить импорт', cz: 'Pokračovat v importu' },
  'importWizard.resultTitle': { en: 'Import finished', ru: 'Импорт завершён', cz: 'Import dokončen' },
  'importWizard.completedWithErrors': {
    en: 'Some rows could not be imported. They are listed with their errors; the rest was saved.',
    ru: 'Некоторые строки не удалось импортировать. Они перечислены с ошибками, остальное сохранено.',
    cz: 'Některé řádky se nepodařilo importovat. Jsou uvedeny s chybami, zbytek byl uložen.',
  },
  'importWizard.resultSummary': {
    en: 'Created {created}, updated {updated}, skipped {skipped}, failed {failed}.',
    ru: 'Создано {created}, обновлено {updated}, пропущено {skipped}, с ошибкой {failed}.',
    cz: 'Vytvořeno {created}, aktualizováno {updated}, přeskočeno {skipped}, selhalo {failed}.',
  },
  'importWizard.finishedAt': { en: 'Finished {when}', ru: 'Завершено {when}', cz: 'Dokončeno {when}' },
  'importWizard.downloadReport': { en: 'Download CSV report', ru: 'Скачать CSV-отчёт', cz: 'Stáhnout CSV report' },
  'importWizard.downloading': { en: 'Downloading...', ru: 'Скачиваем...', cz: 'Stahuji...' },
  'importWizard.reportError': { en: 'Could not download the report.', ru: 'Не удалось скачать отчёт.', cz: 'Report se nepodařilo stáhnout.' },
  'importWizard.createsService': { en: 'new service will be created', ru: 'будет создана новая услуга', cz: 'bude vytvořena nová služba' },
  'importWizard.timezoneHint': { en: 'Dates use {timezone}', ru: 'Даты читаются в {timezone}', cz: 'Datumy se čtou v {timezone}' },
  'importWizard.currencyHint': { en: 'Prices are saved in {currency}', ru: 'Цены сохраняются в {currency}', cz: 'Ceny se ukládají v {currency}' },
  'importWizard.status.uploaded': { en: 'Uploaded', ru: 'Загружен', cz: 'Nahráno' },
  'importWizard.status.mapped': { en: 'Columns matched', ru: 'Колонки сопоставлены', cz: 'Sloupce přiřazeny' },
  'importWizard.status.previewed': { en: 'Preview ready', ru: 'Предпросмотр готов', cz: 'Náhled připraven' },
  'importWizard.status.importing': { en: 'Importing', ru: 'Импортируется', cz: 'Importuje se' },
  'importWizard.status.completed': { en: 'Completed', ru: 'Завершён', cz: 'Dokončen' },
  'importWizard.status.completedWithErrors': { en: 'Completed with errors', ru: 'Завершён с ошибками', cz: 'Dokončen s chybami' },
  'importWizard.status.failed': { en: 'Failed', ru: 'Ошибка', cz: 'Selhal' },
  'importWizard.error.requiredField': { en: 'Required value is missing', ru: 'Не заполнено обязательное поле', cz: 'Chybí povinná hodnota' },
  'importWizard.error.tooLong': { en: 'Value is too long', ru: 'Значение слишком длинное', cz: 'Hodnota je příliš dlouhá' },
  'importWizard.error.invalidPhone': { en: 'Invalid phone', ru: 'Неверный телефон', cz: 'Neplatný telefon' },
  'importWizard.error.invalidEmail': { en: 'Invalid email', ru: 'Неверный email', cz: 'Neplatný e-mail' },
  'importWizard.error.invalidDate': { en: 'Invalid date', ru: 'Неверная дата', cz: 'Neplatné datum' },
  'importWizard.error.invalidChoice': { en: 'Unknown value', ru: 'Неизвестное значение', cz: 'Neznámá hodnota' },
  'importWizard.error.invalidPrice': { en: 'Invalid price', ru: 'Неверная цена', cz: 'Neplatná cena' },
  'importWizard.error.ambiguousMatch': {
    en: 'Several clients match this phone or email',
    ru: 'Несколько клиентов совпадают по телефону или email',
    cz: 'Několik klientů odpovídá telefonu nebo e-mailu',
  },
  'importWizard.error.contactConflict': {
    en: 'Phone and email belong to different clients',
    ru: 'Телефон и email принадлежат разным клиентам',
    cz: 'Telefon a e-mail patří různým klientům',
  },
  'importWizard.error.unknownSpecialist': { en: 'Specialist not found in this business', ru: 'Специалист не найден в этом бизнесе', cz: 'Specialista v této firmě nebyl nalezen' },
  'importWizard.error.ambiguousSpecialist': { en: 'Several specialists match', ru: 'Несколько специалистов подходят', cz: 'Odpovídá několik specialistů' },
  'importWizard.error.unknownService': { en: 'This row has no service and no service name', ru: 'В строке нет услуги и названия услуги', cz: 'Řádek nemá službu ani název služby' },
  'importWizard.error.ambiguousService': { en: 'Several services match', ru: 'Несколько услуг подходят', cz: 'Odpovídá několik služeb' },
  'importWizard.error.clientMissing': { en: 'Client was not created for this row', ru: 'Клиент для строки не создан', cz: 'Klient pro tento řádek nebyl vytvořen' },
  'importWizard.error.extraColumns': { en: 'The row has more values than columns', ru: 'В строке больше значений, чем колонок', cz: 'Řádek má více hodnot než sloupců' },
  'importWizard.error.cellTooLong': { en: 'A cell is longer than 2000 characters', ru: 'Ячейка длиннее 2000 символов', cz: 'Buňka je delší než 2000 znaků' },
  'importWizard.error.formulaNotAllowed': { en: 'Formulas are not imported', ru: 'Формулы не импортируются', cz: 'Vzorce se neimportují' },
  'importWizard.error.malformedRow': { en: 'The row could not be read', ru: 'Строку не удалось прочитать', cz: 'Řádek se nepodařilo přečíst' },
  'importWizard.error.rowFailed': { en: 'The row could not be saved', ru: 'Строку не удалось сохранить', cz: 'Řádek se nepodařilo uložit' },
}

export default translations

