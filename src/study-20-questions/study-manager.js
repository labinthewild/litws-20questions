/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.LITW = window.LITW || {}
window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");

import * as litw_engine from "../js/litw/litw.engine.0.1.0";
LITW.engine = litw_engine;

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', Handlebars.compile(progressHTML));

import introHTML from "./templates/introduction.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import quest1HTML from "./templates/questions1.html";
import quest2HTML from "./templates/questions2.html";
import demographicsHTML from "../templates/demographics.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "./templates/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";

//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbTemplate = Handlebars.compile(irb_LITW_HTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let question1Template = Handlebars.compile(quest1HTML);
let question2Template = Handlebars.compile(quest2HTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);

module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let config = {
		languages: {
			'default': 'en',
			'en': './i18n/en.json?v=1.0',
		},
		study_id: "c2b9e3c2-e317-44b9-a1ea-92418c89c1b1",
		questionsAndResponses: {},
		responsesAndStatements: {},
		maxNumQuestions: 20,
		minNumResponses: 10,
		country: "",
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: introTemplate,
				display_element_id: "intro",
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: irbTemplate,
				template_data: {
					time: study_times.SHORT,
				},
				display_element_id: "irb",
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				name: "demographics",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: demographicsTemplate,
				display_element_id: "demographics",
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				display_next_button: false,
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					config.country = dem_data['demographics-country-grow'];
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			QUESTION1: {
				name: "questionnaire1",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: question1Template,
				display_element_id: "question1",
				display_next_button: false,
			},
			QUESTION2: {
				name: "questionnaire2",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: question2Template,
				display_element_id: "question2",
				display_next_button: false,
			},
			COMMENTS: {
				name: "comments",
				type: LITW.engine.SLIDE_TYPE.SHOW_SLIDE,
				template: commentsTemplate,
				display_element_id: "comments",
				finish: function(){
					let comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				name: "results",
				display_next_button: false,
				type: LITW.engine.SLIDE_TYPE.CALL_FUNCTION,
				call_fn: function(){
					calculateResults();
				}
			}
		}
	};

	function configureTimeline() {
		config.slides.QUESTION1.template_data = () => { return getStudyQuestions(1, 50) };
		config.slides.QUESTION2.template_data = () => { return getStudyQuestions(2, 100) };
		timeline.push(config.slides.INTRODUCTION);
		timeline.push(config.slides.INFORMED_CONSENT);
		timeline.push(config.slides.DEMOGRAPHICS);
		timeline.push(config.slides.QUESTION1);
		timeline.push(config.slides.QUESTION2);
		timeline.push(config.slides.COMMENTS);
		timeline.push(config.slides.RESULTS);
		return timeline;
	}

	function getStudyQuestions(pageNumber, progress) {
		let quest = {
			progress: {
				value: progress
			},
			num_quest: config.maxNumQuestions,
			min_num_resp: config.minNumResponses,
			questions: []
		}
		let indexes = Array.from({length: config.maxNumQuestions}, (_, i) => i + 1);
		if(pageNumber === 2){
			indexes = Object.keys(config.questionsAndResponses);
		}
		for( let index of indexes ) {
			if (pageNumber === 1) {
				quest.questions.push({
					id: index,
					text: `${index}. ${$.i18n("litw-question-page2-prompt")}`
				})
			} else {
				quest.questions.push({
					id: index,
					text: `${index}. ${$.i18n("litw-question-page2-prompt")} \"${config.questionsAndResponses[index]}\"`
				})
			}
		}
		return quest;
	}

	function calculateResults() {
		//Test data!
		if (Object.keys(config.responsesAndStatements).length === 0) {
			config.responsesAndStatements = {1: 'PS', 2: 'RR', 3: 'RR', 4: 'RR', 5: 'PS', 6: 'PS', 7: 'OS', 8: 'OS',
				9: 'RR', 10: 'PS', 11: 'PS', 12: 'PS', 13: 'RR', 14: 'PS',	15: 'OS', 16: 'OS', 17: 'RR', 18: 'PS',
				19: 'PS', 20: 'PS'};
		}
		if(Object.keys(config.questionsAndResponses).length === 0) {
			config.questionsAndResponses = {1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'i', 9: 'j',
				10: 'k', 11: 'l', 12: 'm', 13: 'n', 14: 'o', 15: 'p', 16: 'q', 17: 'r', 18: 's', 19: 't', 20: 'u'}
		}

		let results_data = {};
		let country_data = {};
		let totalNumOfPoints = Object.keys(config.responsesAndStatements).length;
		let personalScore = 0;
		let relationshipsScore = 0;
		let otherScore = 0;

		for (const key in config.responsesAndStatements) {
    		if (config.responsesAndStatements[key] === "PS") {
      			personalScore++;
      		} else if (config.responsesAndStatements[key] === "RR") {
				relationshipsScore++;
			} else {
				otherScore++;
			}
		}
		results_data = {
			"personalScore": personalScore,
			"relationshipsScore": relationshipsScore,
			"otherScore": otherScore,
			"personalPercentage": (personalScore/totalNumOfPoints) * 100,
			"relationshipsPercentage": (relationshipsScore/totalNumOfPoints) * 100,
			"otherPercentage": (otherScore/totalNumOfPoints) * 100,
			"questionsAndResponses": config.questionsAndResponses,
			"responsesAndStatements": config.responsesAndStatements
		}
		country_data = {
			"country": config.country,
			"personalPercentage": (personalScore/totalNumOfPoints) * 100,
			"relationshipsPercentage": (relationshipsScore/totalNumOfPoints) * 100,
		}
		LITW.data.submitStudyData({results_data1: results_data});
		LITW.data.submitStudyData({participant_country_data: country_data});
		chooseMessage(results_data);
		showResults(results_data, true)
	}

	function chooseMessage(results_data) {
		if(results_data.personalScore > results_data.relationshipsScore) {
			results_data.resultStatement1 = $.i18n('litw-results-private1');
			results_data.resultStatement2 = $.i18n('litw-results-private2');
		} else {
			results_data.resultStatement1 = $.i18n('litw-results-collective1');
			results_data.resultStatement2 = $.i18n('litw-results-collective2');
		}
	}

	function showResults(results = {}, showFooter = false) {
		let results_div = $("#results");
		let recom_studies = [];
		LITW.engage.getStudiesRecommendation(config.study_id, (studies) => {recom_studies = studies});

		if('PID' in LITW.data.getURLparams) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		results_div.html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: recom_studies
				}
			));
		}
		results_div.i18n();
		LITW.utils.showSlide("results");
	}

	function bootstrap() {
		let good_config = LITW.engine.configure_study(config.preLoad, config.languages,
			configureTimeline(), config.study_id);
		if (good_config){
			LITW.engine.start_study();
		} else {
			console.error("Study configuration error!");
			//TODO fail nicely, maybe a page with useful info to send to the tech team?
		}
	}



	// when the page is loaded, start the study!
	$(document).ready(function() {
		bootstrap();
	});
	exports.study = {};
	exports.study.params = config

})( window.LITW = window.LITW || {} );


